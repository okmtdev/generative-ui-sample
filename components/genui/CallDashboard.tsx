import type { DashboardData } from "@/lib/miitel/types";

function fmtDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}分${String(s).padStart(2, "0")}秒`;
}

export function CallDashboard({ data }: { data: DashboardData }) {
  const maxDaily = Math.max(1, ...data.daily.map((d) => d.calls));
  return (
    <div className="card">
      <div className="card-head">
        <span className="badge">ダッシュボード</span>
        <h3>{data.periodLabel}の通話/会議サマリ</h3>
      </div>

      <div className="kpi-grid">
        <Kpi label="通話件数" value={`${data.totalCalls}件`} />
        <Kpi label="会議件数" value={`${data.totalMeetings}件`} />
        <Kpi label="平均通話時間" value={fmtDuration(data.avgDurationSec)} />
        <Kpi label="トーク比率" value={`${Math.round(data.talkRatio * 100)}%`} />
      </div>

      <div className="senti-bar" aria-label="感情割合">
        <div className="senti pos" style={{ width: `${data.positiveRate}%` }}>
          ポジ {data.positiveRate}%
        </div>
        <div className="senti neg" style={{ width: `${data.negativeRate}%` }}>
          ネガ {data.negativeRate}%
        </div>
      </div>

      <div className="cols">
        <div>
          <h4>日別件数</h4>
          <div className="bars">
            {data.daily.map((d) => (
              <div key={d.date} className="bar-col">
                <div
                  className="bar"
                  style={{ height: `${(d.calls / maxDaily) * 100}%` }}
                  title={`${d.date}: ${d.calls}件`}
                />
                <span className="bar-label">{d.date}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4>担当者ランキング</h4>
          <ul className="rank">
            {data.topAgents.map((a) => (
              <li key={a.name}>
                <span>{a.name}</span>
                <span className="muted">
                  {a.calls}件 / スコア{a.avgScore}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="kpi">
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
    </div>
  );
}
