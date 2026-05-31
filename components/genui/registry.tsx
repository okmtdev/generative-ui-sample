"use client";

import type { ReactNode } from "react";
import { CallDashboard } from "./CallDashboard";
import { CallHistoryTable } from "./CallHistoryTable";
import { CallDetailCard } from "./CallDetailCard";
import type {
  CallDetail,
  DashboardData,
  SearchResult,
} from "@/lib/miitel/types";

/**
 * ツール名 → 描画するReactコンポーネント の対応表。
 * これが「Generative UI」の肝。LLM が選んだツールの output を、
 * 対応するコンポーネントに流し込む。
 *
 * UI メッセージのツールパートは type が `tool-<toolName>`、
 * 完了時に state==='output-available' で output を持つ（AI SDK v5）。
 */
export function renderToolOutput(
  toolName: string,
  output: unknown,
  handlers: { onPickCall?: (callId: string) => void },
): ReactNode {
  if (output && typeof output === "object" && "error" in output) {
    return <div className="card err">{String((output as { error: unknown }).error)}</div>;
  }

  switch (toolName) {
    case "getCallDashboard":
      return <CallDashboard data={output as DashboardData} />;
    case "searchCallHistory":
      return (
        <CallHistoryTable
          data={output as SearchResult}
          onPickCall={handlers.onPickCall}
        />
      );
    case "getCallDetail":
      return <CallDetailCard data={output as CallDetail} />;
    default:
      // 未知のツール（例: MCP由来）は中身をそのまま見せておく。
      return (
        <div className="card">
          <div className="badge">{toolName}</div>
          <pre className="raw">{JSON.stringify(output, null, 2)}</pre>
        </div>
      );
  }
}
