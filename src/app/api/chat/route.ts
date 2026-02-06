import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { messages, userMR } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response("System Failure: API Key missing.", { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Using the ID that is working for you
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

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

    const result = await model.generateContentStream(prompt);

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            controller.enqueue(new TextEncoder().encode(text));
          }
        }
        controller.close();
      },
    });

    return new Response(stream);

  } catch (error: any) {
    console.error("--- GEMINI API ERROR ---");
    console.error(error.message);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}