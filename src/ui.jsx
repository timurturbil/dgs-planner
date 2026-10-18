import { fmt } from './schedule.js';

export const KIND_LABEL = {
  class: 'Ders', dgs: 'DGS', okul: 'Okul çalışması', deneme: 'Deneme', sport: 'Spor',
  commute: 'Yol', meal: 'Yemek', rest: 'Dinlenme', gap: 'Ara',
};

export function Ring({ pct, size = 64, stroke = 7, label }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="ring" role="img" aria-label={`%${pct}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--accent)" strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset .4s' }}
      />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" className="ring-t">
        {label ?? `%${pct}`}
      </text>
    </svg>
  );
}

export function Check({ on, onClick, label }) {
  return (
    <button className={`chk ${on ? 'on' : ''}`} onClick={onClick} aria-pressed={on} aria-label={label}>
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

export function Block({ b, done, onToggle, now }) {
  const isNow = now != null && now >= b.start && now < b.end;
  const past = now != null && now >= b.end;
  return (
    <div className={`blk k-${b.kind} ${isNow ? 'now' : ''} ${past ? 'past' : ''} ${done ? 'done' : ''}`}>
      <div className="blk-time">
        <span>{fmt(b.start)}</span>
        <span className="muted">{fmt(b.end)}</span>
      </div>
      <div className="blk-bar" />
      <div className="blk-body">
        <div className="blk-title">
          {b.title}
          {isNow && <span className="now-tag">şimdi</span>}
        </div>
        {b.sub && <div className="blk-sub">{b.sub}</div>}
      </div>
      {b.checkable && <Check on={done} onClick={onToggle} label={`${b.title} tamamlandı`} />}
    </div>
  );
}

export function Icon({ name }) {
  const p = {
    program: 'M4 5h16M4 12h16M4 19h10',
    progress: 'M4 19V11M10 19V5M16 19v-6M22 19H2',
    settings: 'M12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM19.4 13a7.5 7.5 0 000-2l2-1.6-2-3.4-2.4 1a7.6 7.6 0 00-1.7-1L15 3.5h-4l-.4 2.5a7.6 7.6 0 00-1.7 1l-2.4-1-2 3.4L6.6 11a7.5 7.5 0 000 2l-2 1.6 2 3.4 2.4-1c.5.4 1.1.7 1.7 1l.3 2.5h4l.4-2.5c.6-.3 1.2-.6 1.7-1l2.4 1 2-3.4z',
    left: 'M15 5l-7 7 7 7',
    right: 'M9 5l7 7-7 7',
    star: 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z',
    trash: 'M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12',
  }[name];
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d={p} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const hours = (m) => {
  const h = m / 60;
  return (Math.round(h * 10) / 10).toString().replace('.', ',');
};
