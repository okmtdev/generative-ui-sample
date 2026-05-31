import type { CallDetail } from "@/lib/miitel/types";

function fmtDuration(sec: number) {
  return `${Math.floor(sec / 60)}分${String(sec % 60).padStart(2, "0")}秒`;
}

export function CallDetailCard({ data }: { data: CallDetail }) {
  const scorePct = Math.round((data.sentimentScore + 1) * 50); // -1..1 → 0..100
  return (
    <div className="card">
      <div className="card-head">
        <span className="badge">通話詳細</span>
        <h3>
          {data.customer} <span className="muted">/ {data.topic}</span>
        </h3>
      </div>

      <div className="detail-meta">
        <span>🗓 {data.startedAt.slice(0, 16).replace("T", " ")}</span>
        <span>🧑‍💼 {data.agent}</span>
        <span>⏱ {fmtDuration(data.durationSec)}</span>
        <span>🗣 トーク比率 {Math.round(data.talkRatio * 100)}%</span>
      </div>

      <p className="summary">{data.summary}</p>

      <div className="score-row">
        <span className="muted">感情スコア</span>
        <div className="score-track">
          <div className="score-fill" style={{ width: `${scorePct}%` }} />
        </div>
        <span>{data.sentimentScore.toFixed(2)}</span>
      </div>

      {data.actionItems.length > 0 && (
        <>
          <h4>ネクストアクション</h4>
          <ul className="actions">
            {data.actionItems.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </>
      )}

      <h4>文字起こし（抜粋）</h4>
      <div className="transcript">
        {data.transcript.map((line, i) => (
          <div key={i} className={`turn ${line.speaker}`}>
            <span className="turn-at">{line.at}</span>
            <span className="turn-who">
              {line.speaker === "agent" ? "担当" : "顧客"}
            </span>
            <span className="turn-text">{line.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
