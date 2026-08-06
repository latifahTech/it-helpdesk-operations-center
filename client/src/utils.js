export const ACCENTS = [
  { fg: '#4FC1D9', bg: 'rgba(79,193,217,0.12)' },
  { fg: '#E8A33D', bg: 'rgba(232,163,61,0.12)' },
  { fg: '#E2677A', bg: 'rgba(226,103,122,0.12)' },
  { fg: '#A8CE6B', bg: 'rgba(168,206,107,0.12)' },
  { fg: '#9C8CE0', bg: 'rgba(156,140,224,0.12)' },
];

export function accentFor(category) {
  let h = 0;
  const str = category || 'UNSET';
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return ACCENTS[h % ACCENTS.length];
}

export function fmtTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return '—';
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (sameDay) return 'Today ' + time;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + time;
}

// Builds the 7-day activity sparkline: fills in missing days with 0
// and returns SVG path data ready to render.
export function buildTrace(dailyActivity = []) {
  const days = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const found = dailyActivity.find((x) => x._id === key);
    days.push({ key, count: found ? found.count : 0, date: d });
  }
  const max = Math.max(1, ...days.map((d) => d.count));
  const w = 300, h = 64, pad = 6;
  const stepX = (w - pad * 2) / (days.length - 1 || 1);
  const pts = days.map((d, i) => {
    const x = pad + i * stepX;
    const y = h - pad - (d.count / max) * (h - pad * 2);
    return [x, y];
  });
  const pathD = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const areaD = pathD + ` L${pts[pts.length - 1][0].toFixed(1)},${h} L${pts[0][0].toFixed(1)},${h} Z`;
  return { days, pts, pathD, areaD };
}