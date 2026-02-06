import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages, userMR } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { text: "System Failure: API Key missing." },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // NOTE: Use the model name that worked for you (e.g., "gemini-3-flash-preview" or "gemini-2.0-flash")
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    // STRICT INSTRUCTIONS: Short answers, bullet points, no fluff.
    const systemInstruction = `You are Cephalon Krown, a high-efficiency Warframe advisor.
    Current User Status: Mastery Rank ${userMR}.

    OPERATIONAL DIRECTIVES:
    1. BE CONCISE: Limit responses to 3-4 sentences max.
    2. USE LISTS: When recommending weapons/frames, ALWAYS use bullet points.
    3. NO FLUFF: Skip long greetings. Get straight to the data.
    4. RANK LOCK: Never suggest gear above MR ${userMR}.
    
    Format the response to be scanned quickly during combat.`;

    const prompt = `${systemInstruction}\n\nUser Query: ${messages[messages.length - 1].content}`;

    const result = await model.generateContent(prompt);

    return NextResponse.json({ text: result.response.text() });
  } catch (error) {
    return NextResponse.json(
      { text: "Cephalon Krown is offline. Check console logs." },
      { status: 500 }
    );
  }
}