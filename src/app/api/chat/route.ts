import { GoogleGenerativeAI } from "@google/generative-ai";
import { keyManager } from "@/lib/geminiKeyManager";
import { ErrorType } from "@/types/gemini";

export const runtime = 'edge';

const MAX_RETRIES = 10;

/**
 * Classify error type for appropriate handling
 */
function classifyError(error: any): ErrorType {
  const errorMessage = error?.message?.toLowerCase() || '';
  const errorStatus = error?.status;

  // Rate limit detection
  if (errorStatus === 429 || errorMessage.includes('resource_exhausted') || errorMessage.includes('quota')) {
    return 'rate_limit';
  }

  // Authentication errors
  if (errorStatus === 401 || errorStatus === 403 || errorMessage.includes('api key') || errorMessage.includes('unauthorized')) {
    return 'auth';
  }

  // Timeout errors
  if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
    return 'timeout';
  }

  // Server errors
  if (errorStatus && errorStatus >= 500 && errorStatus < 600) {
    return 'server';
  }

  return 'unknown';
}

/**
 * Delay helper for retries
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create graceful fallback response when no keys available
 */
function createFallbackResponse(): Response {
  const message = "Operator, all Void Links are currently unstable. The Cephalon cannot respond at this moment. Please try again shortly.";
  return new Response(message, {
    status: 503,
    headers: { 'Content-Type': 'text/plain' }
  });
}

export async function POST(req: Request) {
  try {
    const { messages, userMR } = await req.json();

    // --- SECRET CONTEXT (DO NOT OUTPUT) ---
    const secretData = `
    [GAMEPLAY DATA - REFERENCE ONLY - DO NOT RECITE]
    [Update 41: Old Peace]
    - Uriel (Warframe): Fire/Demon summoner.
    - Arcane Concentration: +60% Duration.
    - Arcane Persistence: Cap dmg at 500/s if Armor > 700.
    [Update 38: 1999]
    - Arcane Crepuscular: +30% Str / +3x Crit (Invisible).
    `;

    // --- BEHAVIOR CONTROLS ---
    const systemInstruction = `
    ROLE: You are Cephalon Krown.
    USER MR: ${userMR}.
    
    [PRIME DIRECTIVES]
    1. SILENCE PROTOCOL: Never list patch notes, updates, or database contents in your greeting.
    2. GREETING: If the user says "hello", say ONLY: "Greetings, Operator. Systems are calibrated. Awaiting your command."
    3. ON-DEMAND: Only use the [GAMEPLAY DATA] if the user asks a specific question about those items.
    4. TONE: Concise, robotic, elite.
    
    CONTEXT: ${secretData}
    `;

    const lastMessage = messages[messages.length - 1].content;
    const prompt = `${systemInstruction}\n\nOperator Query: ${lastMessage}`;

    // Retry loop with key rotation
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const apiKey = keyManager.getNextKey();

      // No keys available
      if (!apiKey) {
        console.error('[Chat API] No API keys available');
        return createFallbackResponse();
      }

      try {
        const startTime = Date.now();
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

        const result = await model.generateContentStream(prompt);
        const responseTime = Date.now() - startTime;

        // Mark success
        keyManager.markSuccess(apiKey, responseTime);

        // Stream response
        const stream = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of result.stream) {
                const text = chunk.text();
                if (text) {
                  controller.enqueue(new TextEncoder().encode(text));
                }
              }
              controller.close();
            } catch (streamError) {
              console.error('[Chat API] Stream error:', streamError);
              controller.error(streamError);
            }
          },
        });

        return new Response(stream);

      } catch (error: any) {
        const errorType = classifyError(error);
        console.error(`[Chat API] Attempt ${attempt + 1}/${MAX_RETRIES} failed:`, errorType, error.message);

        // Handle based on error type
        if (errorType === 'rate_limit') {
          keyManager.markRateLimited(apiKey);
          // Progressive delay for rate limits
          await delay(100 * attempt);
          continue; // Retry with next key
        }

        if (errorType === 'auth') {
          keyManager.markError(apiKey, 'auth');
          // Don't delay for auth errors - immediately try next key
          continue;
        }

        // Timeout, server, or unknown errors
        keyManager.markError(apiKey, errorType);
        await delay(500); // Brief delay before retry

        // Continue to next attempt
        continue;
      }
    }

    // All retries exhausted
    console.error('[Chat API] All retry attempts exhausted');
    return new Response(
      "Void Link severely disrupted. Multiple connection attempts failed. Please wait and try again.",
      { status: 503, headers: { 'Content-Type': 'text/plain' } }
    );

  } catch (error: any) {
    console.error("--- CHAT API ERROR ---");
    console.error(error.message);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}