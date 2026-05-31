# generative-ui-sample

MiiTel の通話/会議データを題材にした **Generative UI** のサンプルアプリ。
チャットに話しかけると、LLM が「どの UI を出すか」を判断してツールを呼び、
その結果に応じて **React コンポーネントが動的に切り替わって描画**されます。

```
「今週のダッシュボード見せて」  → 集計カード + グラフ
「クレームの通話を探して」      → フィルタ可能な履歴テーブル
「call_1002 の詳細を教えて」     → 要約・感情スコア・文字起こしカード
```

設計の詳しい解説は [DESIGN.md](./DESIGN.md) を参照。

## 必要なもの

- Node.js 18.18+（推奨 20/22）
- （任意）[Ollama](https://ollama.com/) … 本物の LLM をローカルで動かす場合

## セットアップ

```bash
npm install
cp .env.example .env.local   # まずはそのままでOK（AI_PROVIDER=mock）
npm run dev                  # http://localhost:3000
```

`.env.local` の `AI_PROVIDER` で「頭脳(LLM)」を切り替えます。

### ① まず動かす（鍵不要・LLM不要）— `mock`

```bash
AI_PROVIDER=mock
```

キーワードでツールを決め打ちするニセ頭脳。鍵もネットワークも不要で、
GenUI の「UI が切り替わる」挙動をすぐ確認できます。

### ② 本物の LLM をローカルで — `ollama`

```bash
brew install ollama
ollama serve
ollama pull qwen2.5          # tool calling 対応モデル（llama3.1 でも可）
```

```bash
# .env.local
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434/v1
OLLAMA_MODEL=qwen2.5
```

LLM が発話を解釈して自分でツールを選びます。Ollama は OpenAI 互換 API を
出すので、専用ライブラリは不要です。

### ③ Claude / OpenAI を使う（APIキーがある場合）

```bash
# .env.local
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-6
```

## MiiTel 実データへの接続（MCP）

データは既定で `lib/miitel/mock-data.ts` のダミーを使います。
本番の MiiTel MCP（`https://mcp.miitel.ai/mcp` / Streamable HTTP / Bearer）に
繋ぐ場合は `.env.local` に以下を追加します（**トークンはここだけに**）：

```bash
MIITEL_MCP_URL=https://mcp.miitel.ai/mcp
MIITEL_MCP_TOKEN=<本番MiiTelで発行したトークン>
```

接続コードは `lib/miitel/mcp.ts` に用意済み。MiiTel MCP のツール名/スキーマが
分かったら、型付きツールへのマッピング（`lib/miitel/client.ts` の TODO）か、
MCP ツールを直接モデルへ渡す方式のどちらかを有効化してください。詳細は
[DESIGN.md](./DESIGN.md) の「データの差し替え」を参照。

## 構成

```
app/
  page.tsx            チャットUI（useChat）＋ツール結果の描画
  api/chat/route.ts   頭脳(LLM)＋ツールを束ねるサーバ
ai/
  provider.ts         AI_PROVIDER で LLM を選択
  mock-router.ts      鍵不要のニセ頭脳（キーワード→tool-call）
tools/index.ts        ★GenUIの本体: 各ツール=1コンポーネント
components/genui/      描画される React 部品 + registry
lib/miitel/            データ層（型 / Mock / MCP接続 / 抽象）
```

> 注: このリポジトリは npm が使えない環境で作成したため、作者環境での
> 起動確認は未実施です。`npm install` 時に AI SDK のバージョン差異で
> 微修正が要る可能性があります（その場合は README に追記してください）。
