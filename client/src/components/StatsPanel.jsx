import { accentFor, buildTrace } from '../utils';

export default function StatsPanel({ stats }) {
  const { totalLogs = 0, categoryStats = [], priorityStats = [], dailyActivity = [] } = stats || {};
  const top = [...categoryStats].sort((a, b) => b.count - a.count).slice(0, 5);
  const max = Math.max(1, ...top.map((c) => c.count));
  const { days, pts, pathD, areaD } = buildTrace(dailyActivity);

  const priorityColors = {
    Critical: '#ef4444',
    High: '#f97316',
    Medium: '#3b82f6',
    Low: '#10b981',
  };

  return (
    <section className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
      {/* Total registered incidents card */}
      <div className="panel stat-total">
        <span className="label">Total Registered Incidents</span>
        <div className="num">{totalLogs.toLocaleString()}</div>
        <div className="num-sub">
          {totalLogs > 0
            ? `Distributed across ${categoryStats.length} departments`
            : 'All tickets resolved / Empty'}
        </div>
      </div>

      {/* Category breakdown panel */}
      <div className="panel">
        <span className="label">Incident Distribution by Category</span>
        <div className="cat-rows">
          {top.length === 0 && (
            <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-faint)' }}>
              No active incidents in queue
            </div>
          )}
          {top.map((c) => {
            const a = accentFor(c.category);
            const pct = max > 0 ? Math.max(6, Math.round((c.count / max) * 100)) : 6;
            return (
              <div className="cat-row" key={c.category}>
                <span className="swatch" style={{ background: a.fg }}></span>
                <span className="name">{c.category}</span>
                <span className="bar-track">
                  <span className="bar-fill" style={{ width: pct + '%', background: a.fg }}></span>
                </span>
                <span className="count">{c.count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Priority level breakdown panel */}
      <div className="panel">
        <span className="label">Incidents by Priority Level</span>
        <div className="cat-rows">
          {(!priorityStats || priorityStats.length === 0) && (
            <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-faint)' }}>
              No priority metrics recorded
            </div>
          )}
          {(priorityStats || []).map((p) => {
            const color = priorityColors[p.priority] || '#3b82f6';
            const maxPriority = Math.max(1, ...(priorityStats || []).map(x => x.count));
            const pct = Math.max(6, Math.round((p.count / maxPriority) * 100));
            return (
              <div className="cat-row" key={p.priority}>
                <span className="swatch" style={{ background: color }}></span>
                <span className="name">{p.priority}</span>
                <span className="bar-track">
                  <span className="bar-fill" style={{ width: pct + '%', background: color }}></span>
                </span>
                <span className="count">{p.count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity trend chart panel */}
      <div className="panel">
        <span className="label">System Audit & Activity Trend</span>
        <div className="trace-wrap">
          <svg viewBox="0 0 300 64" preserveAspectRatio="none">
            <defs>
              <linearGradient id="traceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4FC1D9" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#4FC1D9" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={areaD} fill="url(#traceGrad)" stroke="none" />
            <path d={pathD} fill="none" stroke="#4FC1D9" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
            {pts.map((pt, i) => (
              <circle key={i} cx={pt[0].toFixed(1)} cy={pt[1].toFixed(1)} r="2" fill="#4FC1D9" />
            ))}
          </svg>
        </div>
        <div className="trace-labels">
          {days && days.length >= 7 ? (
            [days[0], days[3], days[6]].map((d, i) => (
              <span key={i}>
                {d?.date ? `${new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })} (${new Date(d.date).toLocaleDateString([], { month: 'numeric', day: 'numeric' })})` : ''}
              </span>
            ))
          ) : (
            <span>Weekly Operational Flow</span>
          )}
        </div>
      </div>
    </section>
  );
}