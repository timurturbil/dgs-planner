import { DAY_SHORT } from './data.js';
import { buildDay, fmt, parseDate, weekDays } from './schedule.js';
import { KIND_LABEL } from './ui.jsx';

const PX = 34; // 1 saatin yüksekliği
const LEGEND = ['class', 'dgs', 'okul', 'deneme', 'sport', 'meal'];

// Dar sütunlar için kısa başlık (renk zaten türü söylüyor)
const short = (t) =>
  t
    .replace(/^(Matematik|Türkçe|Geometri|Hız çalışması|Problem çözümü) · /, '')
    .replace(/^Sayısal mantık · .*/, 'Sayısal mantık')
    .replace('Hazırlık & kahvaltı', 'Kahvaltı')
    .replace('Dinlenme & yemek', 'Dinlenme')
    .replace(' yemeği', '');

// Haftanın 7 gününü saat eksenli tek ızgarada gösterir
export default function WeekGrid({ mon, st, today, nowMin, onPick }) {
  const days = weekDays(mon).map((ds) => buildDay(ds, st));
  const from = Math.floor(Math.min(...days.map((d) => d.wake)) / 60) * 60;
  const to = Math.ceil(Math.max(...days.map((d) => Math.max(d.bed, ...d.blocks.map((b) => b.end)))) / 60) * 60;
  const H = ((to - from) / 60) * PX;
  const y = (m) => ((m - from) / 60) * PX;
  const hoursArr = Array.from({ length: (to - from) / 60 + 1 }, (_, i) => from + i * 60);

  return (
    <section className="wg">
      <div className="wg-legend">
        {LEGEND.map((k) => (
          <span key={k} className={`k-${k}`}>
            <i />
            {KIND_LABEL[k]}
          </span>
        ))}
      </div>
      <div className="wg-grid">
        <div className="wg-head wg-row">
          <span />
          {days.map((d, i) => (
            <button key={d.ds} className={`wg-dh ${d.ds === today ? 'today' : ''}`} onClick={() => onPick(d.ds)}>
              <span>{DAY_SHORT[i]}</span>
              <b>{parseDate(d.ds).getDate()}</b>
            </button>
          ))}
        </div>
        <div className="wg-body wg-row" style={{ height: H }}>
          <div className="wg-hours">
            {hoursArr.map((m) => (
              <span key={m} style={{ top: y(m) }}>
                {fmt(m).slice(0, 2)}
              </span>
            ))}
          </div>
          {days.map((d) => (
            <button key={d.ds} className={`wg-col ${d.ds === today ? 'today' : ''}`} onClick={() => onPick(d.ds)} aria-label={`${d.ds} gününü aç`}>
              {hoursArr.map((m) => (
                <i key={m} className="wg-line" style={{ top: y(m) }} />
              ))}
              {d.blocks.map((b, i) => {
                const h = y(b.end) - y(b.start);
                return (
                  <div
                    key={i}
                    className={`wg-b k-${b.kind} ${b.id && st.done[b.id] ? 'done' : ''}`}
                    style={{ top: y(b.start), height: Math.max(2, h - 1) }}
                    title={`${fmt(b.start)}–${fmt(b.end)} ${b.title}`}
                  >
                    {h >= 18 && <span>{short(b.title)}</span>}
                  </div>
                );
              })}
              {d.ds === today && nowMin != null && nowMin >= from && nowMin <= to && <i className="wg-now" style={{ top: y(nowMin) }} />}
            </button>
          ))}
        </div>
      </div>
      <div className="muted small wg-hint">Bir güne dokun → o günün ayrıntılı akışı açılır.</div>
    </section>
  );
}
