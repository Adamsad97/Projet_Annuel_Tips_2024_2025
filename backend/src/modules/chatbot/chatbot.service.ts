import type { ChatbotConfig } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { AppError } from '../../utils/appError.util';
import { countMatches, keywordMatches, snippet, tokenize } from './chatbot.text';
import type { ChatbotConfigInput, ChatbotResponseInput } from './chatbot.validation';

const DEFAULT_CONFIG = {
  greeting:
    'Bonjour ! Décrivez votre problème en quelques mots et je vous propose les tips les plus utiles.',
  fallbackMessage:
    "Je n'ai pas trouvé de tip qui corresponde vraiment. Posez la question à la communauté : " +
    'les membres vous répondront.',
  contextNote: null,
};

// Pondération du score d'un tip
const WEIGHTS = { title: 3, category: 2, content: 1, upvoteBonus: 0.5 };
const MAX_RESULTS = 3;
// Les tips sont filtrés en mémoire (insensible aux accents) : on borne le volume analysé
const MAX_CANDIDATES = 1000;
// Part minimale des mots de la question retrouvés pour proposer un tip
const MIN_RELEVANCE = 0.34;

export interface ChatbotTipResult {
  id: number;
  title: string;
  kind: string;
  snippet: string;
  categories: string[];
  upvotes: number;
  score: number;
}

export class ChatbotService {
  async getConfig(): Promise<Pick<ChatbotConfig, 'greeting' | 'fallbackMessage' | 'contextNote'>> {
    const config = await prisma.chatbotConfig.findUnique({ where: { id: 1 } });
    return config ?? DEFAULT_CONFIG;
  }

  async ask(question: string, userId?: number) {
    const tokens = tokenize(question);
    const [config, cannedResponse, tips] = await Promise.all([
      this.getConfig(),
      this.findCannedResponse(tokens),
      this.searchTips(tokens),
    ]);

    await prisma.chatbotQuery.create({
      data: {
        question,
        userId,
        tipsFound: tips.length,
        cannedResponseId: cannedResponse?.id ?? null,
      },
    });

    let answer: string;
    if (cannedResponse) {
      answer = cannedResponse.answer;
    } else if (tips.length > 0) {
      answer =
        tips.length === 1
          ? 'Voici le tip qui correspond le mieux à votre problème :'
          : `Voici les ${tips.length} tips qui correspondent le mieux à votre problème :`;
    } else {
      answer = config.fallbackMessage;
    }

    return {
      answer,
      context: config.contextNote,
      link: cannedResponse?.link ?? null,
      tips,
      // Rien de pertinent : on propose de poser la question à la communauté
      suggestAskingCommunity: !cannedResponse && tips.length === 0,
    };
  }

  // ---------- Administration ----------

  async updateConfig(data: ChatbotConfigInput) {
    const current = await this.getConfig();
    return prisma.chatbotConfig.upsert({
      where: { id: 1 },
      update: data,
      create: { ...current, ...data, id: 1 },
    });
  }

  listResponses() {
    return prisma.chatbotResponse.findMany({ orderBy: [{ priority: 'desc' }, { id: 'asc' }] });
  }

  createResponse(data: ChatbotResponseInput) {
    return prisma.chatbotResponse.create({ data });
  }

  async updateResponse(id: number, data: Partial<ChatbotResponseInput>) {
    await this.findResponseOrThrow(id);
    return prisma.chatbotResponse.update({ where: { id }, data });
  }

  async deleteResponse(id: number) {
    await this.findResponseOrThrow(id);
    await prisma.chatbotResponse.delete({ where: { id } });
  }

  // Questions récentes ; `unanswered` : ni tip trouvé ni réponse type (à traiter par l'admin)
  listQueries(unanswered: boolean) {
    return prisma.chatbotQuery.findMany({
      where: unanswered ? { tipsFound: 0, cannedResponseId: null } : {},
      include: { user: { select: { id: true, username: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  // ---------- Recherche ----------

  private async findCannedResponse(tokens: string[]) {
    if (tokens.length === 0) return null;

    const responses = await prisma.chatbotResponse.findMany({
      where: { isActive: true },
      orderBy: [{ priority: 'desc' }, { id: 'asc' }],
    });
    return (
      responses.find((response) =>
        response.keywords.some((keyword) => keywordMatches(keyword, tokens)),
      ) ?? null
    );
  }

  private async searchTips(tokens: string[]): Promise<ChatbotTipResult[]> {
    if (tokens.length === 0) return [];

    const tips = await prisma.tip.findMany({
      where: { status: 'APPROVED' },
      select: {
        id: true,
        title: true,
        kind: true,
        content: true,
        categories: { select: { category: { select: { name: true } } } },
        votes: { where: { value: 1 }, select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: MAX_CANDIDATES,
    });

    return tips
      .map((tip) => {
        const categories = tip.categories.map((c) => c.category.name);
        const titleHits = countMatches(tokens, tip.title);
        const categoryHits = countMatches(tokens, categories.join(' '));
        const contentHits = countMatches(tokens, tip.content ?? '');
        const matchedTokens = Math.max(titleHits, categoryHits, contentHits);
        const relevance = matchedTokens / tokens.length;
        const upvotes = tip.votes.length;

        const score =
          titleHits * WEIGHTS.title +
          categoryHits * WEIGHTS.category +
          contentHits * WEIGHTS.content +
          (relevance >= MIN_RELEVANCE ? Math.log1p(upvotes) * WEIGHTS.upvoteBonus : 0);

        return {
          id: tip.id,
          title: tip.title,
          kind: tip.kind,
          snippet: snippet(tip.content ?? '', tokens),
          categories,
          upvotes,
          score: Math.round(score * 10) / 10,
          relevance,
        };
      })
      .filter((tip) => tip.relevance >= MIN_RELEVANCE)
      .sort((a, b) => b.score - a.score || b.upvotes - a.upvotes)
      .slice(0, MAX_RESULTS)
      .map(({ relevance: _relevance, ...tip }) => tip);
  }

  private async findResponseOrThrow(id: number) {
    const response = await prisma.chatbotResponse.findUnique({ where: { id } });
    if (!response) {
      throw new AppError('chatbot response not found', 404);
    }
    return response;
  }
}

export const chatbotService = new ChatbotService();
