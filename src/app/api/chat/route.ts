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
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
