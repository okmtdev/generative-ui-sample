import type { SearchResult, Sentiment } from "@/lib/miitel/types";

const SENTI_LABEL: Record<Sentiment, string> = {
  positive: "😊 ポジ",
  neutral: "😐 中立",
  negative: "😠 ネガ",
};

function fmtDuration(sec: number) {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

export function CallHistoryTable({
  data,
  onPickCall,
}: {
  data: SearchResult;
  onPickCall?: (callId: string) => void;
}) {
  return (
    <div className="card">
      <div className="card-head">
        <span className="badge">通話履歴</span>
        <h3>
          検索結果 {data.total}件
          {data.keyword ? `（キーワード: ${data.keyword}）` : ""}
        </h3>
      </div>

      {data.items.length === 0 ? (
        <p className="muted">該当する通話は見つかりませんでした。</p>
      ) : (
        <table className="tbl">
          <thead>
            <tr>
              <th>日時</th>
              <th>顧客</th>
              <th>担当</th>
              <th>話題</th>
              <th>感情</th>
              <th>長さ</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((c) => (
              <tr key={c.id}>
                <td className="nowrap">{c.startedAt.slice(5, 16).replace("T", " ")}</td>
                <td>{c.customer}</td>
                <td>{c.agent}</td>
                <td title={c.snippet}>{c.topic}</td>
                <td className={`senti-${c.sentiment}`}>{SENTI_LABEL[c.sentiment]}</td>
                <td className="nowrap">{fmtDuration(c.durationSec)}</td>
                <td>
                  {onPickCall && (
                    <button className="link-btn" onClick={() => onPickCall(c.id)}>
                      詳細
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
