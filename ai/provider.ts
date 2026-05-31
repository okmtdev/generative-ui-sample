import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

export type ProviderName = "mock" | "ollama" | "anthropic" | "openai";

export function getProviderName(): ProviderName {
  return (process.env.AI_PROVIDER as ProviderName) ?? "mock";
}

/**
 * AI_PROVIDER に応じて頭脳(LLM)を返す。
 * 実装本体(ツール・描画)はこのモデルが何であるかを知らない＝差し替え自由。
 *
 * mock の場合はモデルではなく専用ルーター(ai/mock-router.ts)を使うので、
 * ここでは呼ばれない。
 */
export function getModel(): LanguageModel {
  const provider = getProviderName();

  switch (provider) {
    case "ollama": {
      // Ollama は OpenAI 互換APIを出すので baseURL を向けるだけ。
      const ollama = createOpenAI({
        baseURL: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1",
        apiKey: "ollama", // ダミーで可（ローカルは認証なし）
      });
      return ollama.chat(process.env.OLLAMA_MODEL ?? "qwen2.5");
    }

    case "anthropic": {
      const anthropic = createAnthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
      return anthropic(process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6");
    }

    case "openai": {
      const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
      return openai(process.env.OPENAI_MODEL ?? "gpt-4o-mini");
    }

    default:
      throw new Error(
        `getModel() は provider=${provider} では使いません（mock は mock-router を使用）。`,
      );
  }
}
