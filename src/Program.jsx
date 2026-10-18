import { useEffect, useMemo, useState } from 'react';
import { DAY_LONG, DAY_SHORT, MONTHS, TOPIC } from './data.js';
import { addDays, backlog, buildDay, daysBetween, fmt, mondayOf, parseDate, todayStr, weekDays, weekStats } from './schedule.js';
import { Block, Check, Icon, Ring, hours } from './ui.jsx';

const longDate = (ds) => {
  const d = parseDate(ds);
  return `${DAY_LONG[(d.getDay() + 6) % 7]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
};
const shortDate = (ds) => {
  const d = parseDate(ds);
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
};

function useNow() {
  const [t, setT] = useState(() => new Date());
  useEffect(() => {
    const i = setInterval(() => setT(new Date()), 30000);
    return () => clearInterval(i);
  }, []);
  return t;
}

export default function Program({ st, update }) {
  const nowD = useNow();
  const today = todayStr();
  const [sel, setSel] = useState(today);
  useEffect(() => setSel(today), [today]);
  const mon = mondayOf(sel);
  const day = buildDay(sel, st);
  const stats = useMemo(() => weekStats(mon, st), [mon, st]);
  const late = useMemo(() => (sel === today ? backlog(today, st) : []), [sel, today, st]);
  const [showLate, setShowLate] = useState(false);
  const nowMin = sel === today ? nowD.getHours() * 60 + nowD.getMinutes() : sel < today ? 1e9 : null;
  const left = daysBetween(today, st.settings.examDate);
  const p = day.plan;

  const toggle = (id) =>
    update((s) => {
      const done = { ...s.done };
      if (done[id]) delete done[id];
      else done[id] = Date.now();
      return { done };
    });
  const skip = (id) => update((s) => ({ skipped: { ...s.skipped, [id]: true } }));

  const dayTasks = day.tasks;
  const dayDone = dayTasks.filter((t) => st.done[t.id]).length;

  return (
    <div className="page">
      <header className="hero">
        <div>
          <div className="eyebrow">{st.settings.name ? `Merhaba ${st.settings.name}` : 'DGS 2027'}</div>
          <h1>{sel === today ? 'Bugün' : longDate(sel)}</h1>
          {sel === today && <div className="muted">{longDate(sel)}</div>}
        </div>
        <div className="countdown">
          <b>{left > 0 ? left : 0}</b>
          <span>gün kaldı</span>
        </div>
      </header>

      <div className="chips">
        {p.phase >= 1 && p.phase <= 3 && (
          <span className={`chip ph${p.phase}`}>
            Faz {p.phase} · {p.label} · {p.phaseWeek}/{p.phaseLen}. hafta
          </span>
        )}
        {p.phase === 0 && <span className="chip">Program {shortDate(st.settings.startDate)} başlıyor</span>}
        {p.phase === 4 && <span className="chip">Sınav tamamlandı 🎉</span>}
        {day.mode === 'sinav' && <span className="chip warn">{day.period.label || 'Sınav haftası'} · DGS yarıya indi</span>}
        {day.mode === 'tatil' && <span className="chip ok">{day.period.label || 'Tatil'} · DGS artırıldı</span>}
      </div>

      <section className="week">
        <div className="week-head">
          <button className="icon-btn" onClick={() => setSel(addDays(sel, -7))} aria-label="Önceki hafta">
            <Icon name="left" />
          </button>
          <div className="week-title">
            {shortDate(mon)} – {shortDate(addDays(mon, 6))}
            {mon !== mondayOf(today) && (
              <button className="link" onClick={() => setSel(today)}>
                bugüne dön
              </button>
            )}
          </div>
          <button className="icon-btn" onClick={() => setSel(addDays(sel, 7))} aria-label="Sonraki hafta">
            <Icon name="right" />
          </button>
        </div>
        <div className="days">
          {weekDays(mon).map((ds, i) => {
            const d = buildDay(ds, st);
            const tot = d.tasks.length;
            const dn = d.tasks.filter((t) => st.done[t.id]).length;
            return (
              <button key={ds} className={`day ${ds === sel ? 'sel' : ''} ${ds === today ? 'today' : ''}`} onClick={() => setSel(ds)}>
                <span className="dn">{DAY_SHORT[i]}</span>
                <span className="dd">{parseDate(ds).getDate()}</span>
                <span className="dbar">
                  <i style={{ width: tot ? `${(dn / tot) * 100}%` : 0 }} />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="card summary">
        <Ring pct={stats.pct} />
        <div className="sum-body">
          <div className="sum-title">Bu hafta {stats.done}/{stats.total} görev</div>
          <div className="muted small">
            DGS {hours(stats.dgsDone)} / {hours(stats.dgsPlan)} sa · Okul {hours(stats.okulDone)} / {hours(stats.okulPlan)} sa
          </div>
          {p.mat && p.phase <= 3 && (
            <div className="focus">
              <span>Haftanın konuları:</span> {[...p.mat, ...(p.geo || [])].map((t) => TOPIC[t].name).join(', ')} · {TOPIC[p.tr].name}
            </div>
          )}
        </div>
      </section>

      {late.length > 0 && (
        <section className="card late">
          <button className="late-head" onClick={() => setShowLate(!showLate)}>
            <span>
              <b>{late.length}</b> kaçırılan görev bugüne kaydırıldı
            </span>
            <span className="muted">{showLate ? 'gizle' : 'göster'}</span>
          </button>
          {showLate && (
            <div className="late-list">
              {late.map((t) => (
                <div key={t.id} className="late-row">
                  <div>
                    <div className="blk-title">{t.title}</div>
                    <div className="blk-sub">
                      {longDate(t.id.split('#')[0])} · {t.end - t.start} dk
                    </div>
                  </div>
                  <button className="link" onClick={() => skip(t.id)}>
                    atla
                  </button>
                  <Check on={false} onClick={() => toggle(t.id)} label="Yaptım" />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="timeline">
        <div className="tl-head">
          <h2>{sel === today ? 'Günün akışı' : DAY_LONG[(parseDate(sel).getDay() + 6) % 7]}</h2>
          {dayTasks.length > 0 && (
            <span className="muted small">
              {dayDone}/{dayTasks.length} tamamlandı
            </span>
          )}
        </div>
        <div className="marker">⏰ {fmt(day.wake)} Uyanış</div>
        {day.blocks.map((b, i) => (
          <Block key={i} b={b} now={nowMin} done={!!(b.id && st.done[b.id])} onToggle={() => toggle(b.id)} />
        ))}
        <div className="marker">🌙 {fmt(day.bed)} Uyku</div>
      </section>
    </div>
  );
}
