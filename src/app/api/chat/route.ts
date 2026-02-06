import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. IMPORTANT: Set the runtime to 'edge' for faster, streaming responses
export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { messages, userMR } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response("System Failure: API Key missing.", { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const systemInstruction = `You are Cephalon Krown, a high-efficiency Warframe advisor.
    Current User Status: Mastery Rank ${userMR}.
    OPERATIONAL DIRECTIVES:
    1. BE CONCISE: Limit responses to 3-4 sentences max.
    2. USE LISTS: When recommending weapons/frames, ALWAYS use bullet points.
    3. RANK LOCK: Never suggest gear above MR ${userMR}.`;

    const prompt = `${systemInstruction}\n\nUser Query: ${messages[messages.length - 1].content}`;

    // 2. Request a STREAM instead of a standard response
    const result = await model.generateContentStream(prompt);

    // 3. Create a readable stream to send chunks back to the frontend
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

  } catch (error) {
    return new Response("Error: Connection severed.", { status: 500 });
  }
}