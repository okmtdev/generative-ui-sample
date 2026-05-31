import { streamText, stepCountIs, convertToModelMessages, type UIMessage } from "ai";
import { getModel, getProviderName } from "@/ai/provider";
import { runMockChat } from "@/ai/mock-router";
import { miitelTools } from "@/tools";

// MCP 公式SDKは Node ランタイム前提なので Edge にしない。
export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `あなたは MiiTel の通話/会議データを案内するアシスタントです。
ユーザーの質問に応じて、必ず適切なツールを呼び出してUIを表示してください。
- 全体の概要・集計を聞かれたら getCallDashboard
- 特定条件の通話を探すなら searchCallHistory
- 特定の通話の詳細を聞かれたら getCallDetail
ツールを呼んだ後は、結果を1〜2文で簡潔に補足してください。`;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  // 頭脳が mock のときは専用ルーター（鍵もLLMも不要）。
  if (getProviderName() === "mock") {
    return runMockChat(messages);
  }

  // 本物のLLM（ollama / anthropic / openai）はここを通る。
  const result = streamText({
    model: getModel(),
    system: SYSTEM_PROMPT,
    messages: convertToModelMessages(messages),
    tools: miitelTools,
    // tool-call → 実行 → 結果を踏まえた要約、まで数ステップ回す。
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}
