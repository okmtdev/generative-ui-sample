import type { MiitelClient } from "./types";
import { MockMiitelClient } from "./mock-data";

/**
 * 自前で定義した型付きツール(getCallDashboard 等)が使うデータソース。
 *
 * 現状は常に Mock を返す。実 MiiTel データに差し替える方法は2通り:
 *
 *  (1) この関数で、MIITEL_MCP_URL がある場合に MCP を呼んで
 *      DashboardData / SearchResult / CallDetail へ正規化する
 *      McpMiitelClient を実装して返す（MiiTel MCP のツール名が分かってから）。
 *
 *  (2) もしくは MCP のツールをそのまま LLM に渡す方式（lib/miitel/mcp.ts）。
 *      この場合は型付きコンポーネントではなく汎用描画になる。
 *
 * まずは (1) の口だけ用意してある。
 */
export async function getMiitelClient(): Promise<MiitelClient> {
  // if (isMcpConfigured()) return new McpMiitelClient();  // ← 実装したら有効化
  return new MockMiitelClient();
}
