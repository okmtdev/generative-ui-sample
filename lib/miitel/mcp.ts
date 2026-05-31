import { experimental_createMCPClient as createMCPClient } from "ai";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { getMiitelToken, hasMiitelCredentials } from "./auth";

/**
 * MiiTel の本番 MCP (https://mcp.miitel.ai/mcp) へ接続する。
 *
 * ポイント:
 *  - `/mcp` 終端なので **Streamable HTTP** トランスポート。SSE(/sse) とは別物。
 *    AI SDK ビルトインの SSE ではなく、MCP 公式 SDK の
 *    StreamableHTTPClientTransport を渡す。
 *  - 認証は Authorization: Bearer <token>。トークンは
 *    lib/miitel/auth.ts 経由で取得（静的 MIITEL_MCP_TOKEN か、
 *    access_key から authenticate して自動更新）。
 */
export function isMcpConfigured(): boolean {
  // URL があり、かつ 静的トークン or access_key のどちらかがある
  return Boolean(
    process.env.MIITEL_MCP_URL &&
      (process.env.MIITEL_MCP_TOKEN || hasMiitelCredentials()),
  );
}

export async function createMiitelMcpClient() {
  const url = process.env.MIITEL_MCP_URL;
  if (!url) {
    throw new Error("MIITEL_MCP_URL が未設定です。.env.local を確認してください。");
  }

  // 静的トークン or authenticate 経由で取得（期限が近ければ自動更新）
  const token = await getMiitelToken();

  const transport = new StreamableHTTPClientTransport(new URL(url), {
    requestInit: {
      headers: { Authorization: `Bearer ${token}` },
    },
  });

  return createMCPClient({ transport });
}

/**
 * MiiTel MCP が公開しているツール群を、そのまま LLM に渡せる形で取得する。
 * 実際のツール名/スキーマは MiiTel 側の定義に従う（こちらで決め打ちしない）。
 *
 * 使い方(route側): 取得した tools を自前ツールとマージしてモデルへ渡す。
 * 返り値の client は使い終わったら client.close() すること。
 */
export async function getMiitelMcpTools() {
  const client = await createMiitelMcpClient();
  const tools = await client.tools(); // MCP のツールを AI SDK ツールへ変換
  return { client, tools };
}
