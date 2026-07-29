import { NextResponse } from "next/server";
import { findMatches } from "@/lib/faq";
import { generateReply } from "@/lib/openai";
import type { ChatRequest, ChatResponse } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body: ChatRequest = await request.json();
    const { session_id, message } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required and must be a string" },
        { status: 400 }
      );
    }

    const candidates = findMatches(message);
    const { reply, matchedFaqId } = await generateReply(message, candidates);
    const follow_up_required = matchedFaqId === null;

    const response: ChatResponse = {
      reply,
      matched_faq_id: matchedFaqId,
      follow_up_required,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Chat API error:", error);
    const msg = error?.message || error?.toString() || "";
    const isQuota = error?.status === 429 || error?.code === "insufficient_quota" || msg.includes("quota") || msg.includes("429");
    return NextResponse.json(
      { error: isQuota ? "API quota exceeded. Check your Gemini billing at https://aistudio.google.com." : "Internal server error" },
      { status: isQuota ? 503 : 500 }
    );
  }
}
