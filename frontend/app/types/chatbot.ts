export interface ChatbotTip {
  id: number;
  title: string;
  kind: 'TIP' | 'QUESTION';
  snippet: string;
  categories: string[];
  upvotes: number;
  score: number;
}

// Réponse de POST /chatbot/ask
export interface ChatbotAnswer {
  answer: string;
  context: string | null;
  link: string | null;
  tips: ChatbotTip[];
  suggestAskingCommunity: boolean;
}

export interface ChatbotConfig {
  greeting: string;
  fallbackMessage: string;
  contextNote: string | null;
}

export interface ChatbotCannedResponse {
  id: number;
  keywords: string[];
  answer: string;
  link: string | null;
  priority: number;
  isActive: boolean;
}

export interface ChatbotQueryLog {
  id: number;
  question: string;
  tipsFound: number;
  cannedResponseId: number | null;
  createdAt: string;
  user: { id: number; username: string } | null;
}
