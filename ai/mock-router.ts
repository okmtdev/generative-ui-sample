import {
  streamText,
  stepCountIs,
  simulateReadableStream,
  convertToModelMessages,
  type LanguageModel,
  type UIMessage,
} from "ai";
import { miitelTools, type MiitelToolName } from "@/tools";
import type { Period } from "@/lib/miitel/types";

/**
 * 鍵もLLMも無い環境で動かすための「ニセ頭脳」。
 * ユーザー発話のキーワードから {どのツールを/どんな引数で} 呼ぶかを決め打ちし、
 * 本物のLLMが返すのと同じ形式(tool-call)で MockLanguageModelV2 から emit する。
 *
 * → そのあとは本物と同じ streamText パイプラインに乗るので、
 *   ツール実行もUIストリームもクライアント描画も本番と完全に同じコードパス。
 */
function route(text: string): {
  intro: string;
  toolName: MiitelToolName;
  input: Record<string, unknown>;
} {
  const t = text.toLowerCase();

  const period: Period = /先週|last\s*week/.test(t)
    ? "last_week"
    : /今日|today/.test(t)
      ? "today"
      : /今月|this\s*month/.test(t)
        ? "this_month"
        : "this_week";

  // 1) 通話IDが含まれていれば詳細
  const idMatch = text.match(/call_\d+/);
  if (idMatch || /詳細|詳しく|くわしく|内容|文字起こし/.test(t)) {
    const callId = idMatch?.[0] ?? "call_1002";
    return {
      intro: `通話 ${callId} の詳細を表示します。`,
      toolName: "getCallDetail",
      input: { callId },
    };
  }

  // 2) 検索/履歴っぽければ一覧
  if (/探|検索|履歴|一覧|list|find|クレーム|解約|アップセル/.test(t)) {
    const keyword = ["クレーム", "解約", "アップセル", "請求", "導入"].find((k) =>
      text.includes(k),
    );
    return {
      intro: keyword
        ? `「${keyword}」に関する通話履歴を検索します。`
        : "通話履歴を検索します。",
      toolName: "searchCallHistory",
      input: { keyword, period },
    };
  }

  // 3) それ以外はダッシュボード
  return {
    intro: "通話/会議のダッシュボードを表示します。",
    toolName: "getCallDashboard",
    input: { period },
  };
}

export function runMockChat(messages: UIMessage[]): Response {
  const lastUser = [...messages]
    .reverse()
    .find((m) => m.role === "user");
  const text =
    lastUser?.parts
      ?.map((p) => ("text" in p ? p.text : ""))
      .join(" ")
      .trim() ?? "";

  const { intro, toolName, input } = route(text);

  // ニセLLM（最小の LanguageModelV2 実装）。
  // ※ ai/test の MockLanguageModelV2 はテスト専用依存(msw/vitest)を
  //    引き込み本番ビルドが壊れるため、ここで自前定義する。
  const model = {
    specificationVersion: "v2",
    provider: "mock",
    modelId: "mock-router",
    supportedUrls: {},
    doGenerate: async () => {
      throw new Error("mock model is stream-only");
    },
    doStream: async () => ({
      stream: simulateReadableStream({
        chunkDelayInMs: 20,
        chunks: [
          { type: "stream-start", warnings: [] },
          { type: "text-start", id: "intro" },
          { type: "text-delta", id: "intro", delta: intro },
          { type: "text-end", id: "intro" },
          {
            type: "tool-call",
            toolCallId: `mock_${Date.now()}`,
            toolName,
            input: JSON.stringify(input),
          },
          {
            type: "finish",
            finishReason: "tool-calls",
            usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
          },
        ],
      }),
    }),
  } as unknown as LanguageModel;

  const result = streamText({
    model,
    messages: convertToModelMessages(messages),
    tools: miitelTools,
    // ツールを1回実行したら停止（mockモデルは毎回同じtool-callを返すのでループ防止）。
    stopWhen: stepCountIs(1),
  });

  return result.toUIMessageStreamResponse();
}
