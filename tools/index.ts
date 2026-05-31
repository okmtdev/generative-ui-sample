import { tool } from "ai";
import { z } from "zod";
import { getMiitelClient } from "@/lib/miitel/client";

const periodSchema = z
  .enum(["today", "this_week", "last_week", "this_month"])
  .describe("集計・検索の対象期間");

/**
 * Generative UI の本体。
 * 各ツール = 1つのUIコンポーネント。LLM はユーザーの発話を見て
 * 「どのツールを、どんな引数で呼ぶか」を決める。返ってきた構造化データを
 * クライアントが対応する React コンポーネントで描画する。
 *
 * description と inputSchema は LLM 向けのAPIドキュメント。
 * ここを丁寧に書くほどツール選択の精度が上がる。
 */
export const miitelTools = {
  getCallDashboard: tool({
    description:
      "通話/会議の集計ダッシュボードを表示する。件数・平均通話時間・感情(ポジ/ネガ)割合・担当者ランキングなど、全体の概要を俯瞰したいときに使う。",
    inputSchema: z.object({ period: periodSchema }),
    execute: async ({ period }) => {
      const client = await getMiitelClient();
      return client.getDashboard(period);
    },
  }),

  searchCallHistory: tool({
    description:
      "通話履歴を検索して一覧表示する。『クレームの通話』『〇〇社との通話』など条件で絞り込みたいときに使う。keyword は話題・顧客名・担当者名にマッチする。",
    inputSchema: z.object({
      keyword: z
        .string()
        .optional()
        .describe("検索キーワード（話題/顧客名/担当者名）。無指定なら全件。"),
      period: periodSchema,
      limit: z.number().int().min(1).max(50).optional().describe("最大件数"),
    }),
    execute: async ({ keyword, period, limit }) => {
      const client = await getMiitelClient();
      return client.searchCalls({ keyword, period, limit });
    },
  }),

  getCallDetail: tool({
    description:
      "特定の通話1件の詳細(要約・感情スコア・文字起こし抜粋・ネクストアクション)を表示する。callId は searchCallHistory の結果の id を使う。",
    inputSchema: z.object({
      callId: z.string().describe("通話ID（例: call_1002）"),
    }),
    execute: async ({ callId }) => {
      const client = await getMiitelClient();
      const detail = await client.getCall(callId);
      if (!detail) return { error: `通話 ${callId} が見つかりませんでした。` };
      return detail;
    },
  }),
};

export type MiitelToolName = keyof typeof miitelTools;
