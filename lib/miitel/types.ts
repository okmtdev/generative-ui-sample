// MiiTel データの型。Mock でも MCP でもこの型に正規化して扱う。
// （UIコンポーネントはこの型だけに依存し、データソースの違いを知らない）

export type Period = "today" | "this_week" | "last_week" | "this_month";

export type Sentiment = "positive" | "neutral" | "negative";

/** 通話/会議1件のサマリ（一覧・詳細で共有） */
export interface CallSummary {
  id: string;
  /** ISO8601 */
  startedAt: string;
  agent: string;
  customer: string;
  durationSec: number;
  sentiment: Sentiment;
  topic: string;
  /** 一覧で見せる一言抜粋 */
  snippet: string;
}

/** ダッシュボード集計 */
export interface DashboardData {
  period: Period;
  periodLabel: string;
  totalCalls: number;
  totalMeetings: number;
  avgDurationSec: number;
  /** 自分が話した割合(%) talk:listen */
  talkRatio: number;
  positiveRate: number;
  negativeRate: number;
  daily: { date: string; calls: number }[];
  topAgents: { name: string; calls: number; avgScore: number }[];
}

/** 履歴検索結果 */
export interface SearchResult {
  keyword?: string;
  period: Period;
  total: number;
  items: CallSummary[];
}

/** 通話詳細 */
export interface CallDetail extends CallSummary {
  summary: string;
  /** -1.0 〜 1.0 */
  sentimentScore: number;
  talkRatio: number;
  transcript: { speaker: "agent" | "customer"; text: string; at: string }[];
  actionItems: string[];
}

/** データソースの抽象。Mock / MCP がこれを実装する。 */
export interface MiitelClient {
  getDashboard(period: Period): Promise<DashboardData>;
  searchCalls(args: {
    keyword?: string;
    period: Period;
    limit?: number;
  }): Promise<SearchResult>;
  getCall(callId: string): Promise<CallDetail | null>;
}
