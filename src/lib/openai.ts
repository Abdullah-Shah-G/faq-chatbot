import { GoogleGenerativeAI } from "@google/generative-ai";
import type { MatchResult } from "./types";

let genAI: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }
  return genAI;
}

const SYSTEM_PROMPT = `You are SupportBot, a concise and accurate FAQ assistant. Always try to answer from the provided FAQ knowledge base. If the user's question matches an FAQ entry, respond with the FAQ answer and show a one-line citation like "(source: FAQ)". If the user asks something not in the FAQ, ask one clarifying question or reply: "I don't have that information — would you like me to escalate or search for more details?" Keep answers short (max 120 words). Avoid hallucinations. If the user asks for links or actions, provide them only if present in the FAQ.`;

export async function generateReply(
  userMessage: string,
  candidateFaqs: MatchResult[]
): Promise<{ reply: string; matchedFaqId: string | null }> {
  const context =
    candidateFaqs.length > 0
      ? `Context (candidate FAQs):\n${candidateFaqs
          .map(
            (c, i) =>
              `${i + 1}) Q: ${c.faq.question}\n   A: ${c.faq.answer}`
          )
          .join("\n\n")}\n\nUser: ${userMessage}`
      : `User: ${userMessage}`;

  const model = getClient().getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: { maxOutputTokens: 250, temperature: 0.2 },
  });

  const result = await model.generateContent(context);
  const reply = result.response.text() || "I'm sorry, I couldn't process that request.";
  const matchedFaqId =
    reply.includes("(source: FAQ)") && candidateFaqs.length > 0
      ? candidateFaqs[0].faq.id
      : null;

  return { reply, matchedFaqId };
}
