export interface FaqEntry {
  id: string;
  question: string;
  answer: string;
  tags: string[];
  last_updated: string;
}

export interface MatchResult {
  faq: FaqEntry;
  score: number;
}

export interface ChatRequest {
  session_id: string;
  message: string;
}

export interface ChatResponse {
  reply: string;
  matched_faq_id: string | null;
  follow_up_required: boolean;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  matchedFaqId?: string | null;
}
