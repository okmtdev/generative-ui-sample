# 設計メモ: Generative UI とは / どう作るか

## Generative UI とは

LLM の応答を「テキスト」ではなく「**UI コンポーネント**」にする考え方。
LLM が文脈に応じて「ここは表」「ここはカード」「ここはフォーム」と判断し、
構造化された UI を動的にレンダリングする。

```
従来:  入力 → LLM → テキスト
GenUI: 入力 → LLM → (どのUI部品を / どんなデータで) → React コンポーネント描画
```

実現方式は主に 2 つ。本サンプルは安全・予測可能な **①** を採用。

| 方式 | 仕組み |
|------|--------|
| ① Tool Calling + 事前定義コンポーネント | LLM に「ダッシュボード」「履歴表」等のツールを登録。LLM が引数付きで呼ぶ → その結果で対応 React 部品を描画 |
| ② コード/JSXをその場で生成 | LLM が UI 自体を生成。自由度は高いが安全性・安定性の担保が難しい |

## 中核アイデア: 1 ツール = 1 コンポーネント

`tools/index.ts` の各ツールが UI 部品に 1:1 対応する。

```
getCallDashboard   → <CallDashboard />     (集計カード+グラフ)
searchCallHistory  → <CallHistoryTable />  (一覧テーブル)
getCallDetail      → <CallDetailCard />    (詳細・文字起こし)
```

ツールの `description` / `inputSchema` が LLM 向けの API ドキュメントになる。
ここを丁寧に書くほどツール選択の精度が上がる。

## データフロー

```
[client] page.tsx
   useChat → POST /api/chat  (UIMessage[])
        │
[server] api/chat/route.ts
   provider=mock?  ── yes ─→ ai/mock-router.ts (キーワードで tool-call を捏造)
        │ no                      │
   getModel() (ollama/anthropic/openai)
        └──────────┬─────────────┘
            streamText({ model, tools })
                │  LLM が tool-call を決定
                ▼
            tool.execute() → getMiitelClient() → Mock or MCP からデータ取得
                │
            toUIMessageStreamResponse()  ← tool 出力を含む UI ストリーム
        │
[client] message.parts を走査
   - type==='text'        → 吹き出し
   - type==='tool-<name>' → registry.tsx が toolName で部品を選んで output を描画
```

ポイント: **mock / ollama / claude のどれでも、tool 実行〜描画は同じコードパス**。
頭脳だけ差し替わる。

## 2 つの差し替え軸（環境変数だけで段階的に本物化）

### 軸1: 頭脳 (LLM) — `AI_PROVIDER`
- `mock` … 鍵もLLMも不要。`ai/mock-router.ts` がキーワードで決め打ち。
  本物の `streamText` パイプラインに `MockLanguageModelV2` で tool-call を流すので、
  ツール実行と描画は本番と同一。
- `ollama` … ローカル LLM。OpenAI 互換 API（`@ai-sdk/openai` の baseURL 差し替え）。
- `anthropic` / `openai` … 各社 API。

### 軸2: データ — MiiTel MCP
既定は `lib/miitel/mock-data.ts`。実データは `https://mcp.miitel.ai/mcp`。

- **Streamable HTTP** トランスポート（`/mcp` 終端）。SSE（`/sse`）とは別物。
  AI SDK ビルトインの SSE ではなく MCP 公式 SDK の
  `StreamableHTTPClientTransport` を使う（`lib/miitel/mcp.ts`）。
- 認証は `Authorization: Bearer <token>`。トークンは `.env.local` のみ。

MCP の繋ぎ込みは 2 通り:
1. **型付きマッピング**: `lib/miitel/client.ts` に `McpMiitelClient` を実装し、
   MCP の応答を `DashboardData`/`SearchResult`/`CallDetail` に正規化。
   → 既存の型付きコンポーネントがそのまま使える（推奨だが MCP のツール名要確認）。
2. **MCP ツールを直接モデルへ**: `getMiitelMcpTools()` の tools を route で
   自前ツールにマージしてモデルへ渡す。→ 描画は汎用（registry の default 分岐）。

## 段階的に上げる本物度

| 段階 | AI_PROVIDER | データ | 必要なもの |
|------|-------------|--------|-----------|
| 0 | mock | Mock | なし（すぐ動く） |
| 1 | ollama | Mock | Ollama をローカルに |
| 2 | ollama | MiiTel MCP | + MCP トークン |
| 3 | anthropic | MiiTel MCP | + Claude APIキー |

## このサンプルで割り切っている点
- 認証/マルチテナント、永続化、エラー再試行は未実装。
- Mock データは少量・期間判定も簡易（学習用）。
- 方式② (UI 自体の生成) は扱わない。
