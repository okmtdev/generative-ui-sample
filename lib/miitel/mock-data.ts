import type {
  CallDetail,
  CallSummary,
  DashboardData,
  MiitelClient,
  Period,
  SearchResult,
} from "./types";

const PERIOD_LABEL: Record<Period, string> = {
  today: "今日",
  this_week: "今週",
  last_week: "先週",
  this_month: "今月",
};

// ── ダミーの通話/会議データ ──────────────────────────────
const CALLS: CallSummary[] = [
  {
    id: "call_1001",
    startedAt: "2026-05-25T10:12:00+09:00",
    agent: "佐藤 千夏",
    customer: "株式会社アオゾラ商事",
    durationSec: 842,
    sentiment: "positive",
    topic: "新規導入の相談",
    snippet: "料金プランと導入スケジュールについて前向きに検討いただけました。",
  },
  {
    id: "call_1002",
    startedAt: "2026-05-26T14:03:00+09:00",
    agent: "鈴木 大地",
    customer: "ミドリ工業",
    durationSec: absSec(21, 30),
    sentiment: "negative",
    topic: "請求に関するクレーム",
    snippet: "二重請求の指摘。謝罪のうえ経理へエスカレーションを約束。",
  },
  {
    id: "call_1003",
    startedAt: "2026-05-27T09:45:00+09:00",
    agent: "佐藤 千夏",
    customer: "ハル印刷",
    durationSec: absSec(6, 12),
    sentiment: "neutral",
    topic: "操作方法の問い合わせ",
    snippet: "レポート出力手順を案内。マニュアルのURLを送付。",
  },
  {
    id: "call_1004",
    startedAt: "2026-05-27T16:20:00+09:00",
    agent: "高橋 玲",
    customer: "そら不動産",
    durationSec: absSec(33, 5),
    sentiment: "positive",
    topic: "アップセル提案",
    snippet: "上位プランの提案に好感触。次回デモの日程調整へ。",
  },
  {
    id: "call_1005",
    startedAt: "2026-05-28T11:00:00+09:00",
    agent: "鈴木 大地",
    customer: "ミドリ工業",
    durationSec: absSec(18, 44),
    sentiment: "negative",
    topic: "解約の相談",
    snippet: "競合への乗り換えを検討中。前回のクレーム対応への不満が背景。",
  },
  {
    id: "call_1006",
    startedAt: "2026-05-29T13:30:00+09:00",
    agent: "高橋 玲",
    customer: "アオゾラ商事",
    durationSec: absSec(12, 8),
    sentiment: "neutral",
    topic: "契約更新の確認",
    snippet: "更新条件を確認。稟議に回す旨の連絡を待つ。",
  },
];

function absSec(min: number, sec: number) {
  return min * 60 + sec;
}

const DETAILS: Record<string, Omit<CallDetail, keyof CallSummary>> = {
  call_1002: {
    summary:
      "顧客から同一サービスの二重請求の指摘。担当は事実確認のうえ謝罪し、経理部門へエスカレーション。翌営業日までに返金可否を回答すると約束した。",
    sentimentScore: -0.62,
    talkRatio: 0.38,
    transcript: [
      { speaker: "customer", text: "先月分、二重で引き落とされてるんですけど。", at: "00:12" },
      { speaker: "agent", text: "大変申し訳ございません。すぐに確認いたします。", at: "00:18" },
      { speaker: "customer", text: "前も似たことあったよね。困るんだよ。", at: "00:41" },
      { speaker: "agent", text: "ご迷惑をおかけしております。経理に確認し、明日中にご連絡します。", at: "00:55" },
    ],
    actionItems: [
      "経理部門へ二重請求の調査を依頼",
      "翌営業日までに返金可否を顧客へ連絡",
      "過去の同種インシデントを確認し再発防止策を共有",
    ],
  },
  call_1004: {
    summary:
      "現行プランの利用状況を踏まえ上位プランを提案。コスト増への懸念はあったが ROI 試算で納得感が得られ、次回デモの設定に合意。",
    sentimentScore: 0.71,
    talkRatio: 0.55,
    transcript: [
      { speaker: "agent", text: "現状ですと上位プランの方が単価が下がる試算です。", at: "00:30" },
      { speaker: "customer", text: "へえ、それは知らなかった。詳しく聞きたいな。", at: "00:48" },
      { speaker: "agent", text: "では来週デモのお時間をいただけますか？", at: "01:30" },
      { speaker: "customer", text: "火曜の午後ならいけます。", at: "01:42" },
    ],
    actionItems: ["火曜午後のデモ日程を確定", "ROI 試算資料を送付"],
  },
};

const DEFAULT_DETAIL: Omit<CallDetail, keyof CallSummary> = {
  summary: "（この通話の詳細サマリはダミーデータには含まれていません）",
  sentimentScore: 0,
  talkRatio: 0.5,
  transcript: [
    { speaker: "agent", text: "本日はお時間ありがとうございます。", at: "00:03" },
    { speaker: "customer", text: "よろしくお願いします。", at: "00:07" },
  ],
  actionItems: [],
};

// ── 期間フィルタ（ダミーなので簡易判定） ──────────────────
function inPeriod(call: CallSummary, period: Period): boolean {
  const d = new Date(call.startedAt);
  const day = d.getDate();
  switch (period) {
    case "today":
      return day === 29;
    case "this_week":
      return day >= 25;
    case "last_week":
      return day >= 18 && day <= 24;
    case "this_month":
      return true;
  }
}

export class MockMiitelClient implements MiitelClient {
  async getDashboard(period: Period): Promise<DashboardData> {
    const calls = CALLS.filter((c) => inPeriod(c, period));
    const total = calls.length || 1;
    const avg = Math.round(
      calls.reduce((s, c) => s + c.durationSec, 0) / total,
    );
    const positive = calls.filter((c) => c.sentiment === "positive").length;
    const negative = calls.filter((c) => c.sentiment === "negative").length;

    const byDate = new Map<string, number>();
    for (const c of calls) {
      const key = c.startedAt.slice(5, 10); // MM-DD
      byDate.set(key, (byDate.get(key) ?? 0) + 1);
    }

    const byAgent = new Map<string, number>();
    for (const c of calls) byAgent.set(c.agent, (byAgent.get(c.agent) ?? 0) + 1);

    return {
      period,
      periodLabel: PERIOD_LABEL[period],
      totalCalls: calls.length,
      totalMeetings: Math.round(calls.length / 2),
      avgDurationSec: avg,
      talkRatio: 0.48,
      positiveRate: Math.round((positive / total) * 100),
      negativeRate: Math.round((negative / total) * 100),
      daily: [...byDate.entries()]
        .sort()
        .map(([date, c]) => ({ date, calls: c })),
      topAgents: [...byAgent.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([name, c]) => ({
          name,
          calls: c,
          avgScore: Math.round(60 + Math.random() * 35),
        })),
    };
  }

  async searchCalls({
    keyword,
    period,
    limit = 20,
  }: {
    keyword?: string;
    period: Period;
    limit?: number;
  }): Promise<SearchResult> {
    let items = CALLS.filter((c) => inPeriod(c, period));
    if (keyword) {
      const k = keyword.toLowerCase();
      items = items.filter((c) =>
        [c.topic, c.snippet, c.customer, c.agent]
          .join(" ")
          .toLowerCase()
          .includes(k),
      );
    }
    items = items
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
      .slice(0, limit);
    return { keyword, period, total: items.length, items };
  }

  async getCall(callId: string): Promise<CallDetail | null> {
    const base = CALLS.find((c) => c.id === callId);
    if (!base) return null;
    return { ...base, ...(DETAILS[callId] ?? DEFAULT_DETAIL) };
  }
}
