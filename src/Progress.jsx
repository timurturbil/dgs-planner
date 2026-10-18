import { useMemo, useState } from 'react';
import { GROUPS, MONTHS, TOPICS, uid } from './data.js';
import { addDays, mondayOf, parseDate, todayStr, topicCounts, weekStats } from './schedule.js';
import { Icon, Ring, hours } from './ui.jsx';

const STATUS = ['Başlanmadı', 'Çalışılıyor', 'Bitti'];
const sd = (ds) => {
  const d = parseDate(ds);
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
};

function WeekBars({ data }) {
  const W = 320, H = 120, pad = 18, bw = (W - pad) / data.length;
  return (
    <svg viewBox={`0 0 ${W} ${H + 22}`} className="chart" role="img" aria-label="Son haftaların tamamlanma oranı">
      {[0, 50, 100].map((v) => (
        <g key={v}>
          <line x1={pad} x2={W} y1={H - (v / 100) * H + 4} y2={H - (v / 100) * H + 4} className="grid" />
          <text x={0} y={H - (v / 100) * H + 8} className="axis">{v}</text>
        </g>
      ))}
      {data.map((d, i) => {
        const h = Math.max(2, (d.pct / 100) * H);
        return (
          <g key={d.mon}>
            <rect x={pad + i * bw + 5} y={H - h + 4} width={bw - 10} height={h} rx="4" className={d.current ? 'bar cur' : 'bar'}>
              <title>%{d.pct}</title>
            </rect>
            <text x={pad + i * bw + bw / 2} y={H + 20} textAnchor="middle" className="axis">{sd(d.mon)}</text>
          </g>
        );
      })}
    </svg>
  );
}

function NetChart({ exams, target }) {
  const W = 320, H = 150, L = 24, T = 8;
  const pts = [...exams].sort((a, b) => (a.date < b.date ? -1 : 1));
  const x = (i) => L + (pts.length < 2 ? (W - L) / 2 : (i * (W - L - 8)) / (pts.length - 1));
  const y = (v) => T + H - (v / 50) * H;
  const path = (k) => pts.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(Number(p[k]) || 0)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H + 30}`} className="chart" role="img" aria-label="Deneme netleri">
      {[0, 25, 50].map((v) => (
        <g key={v}>
          <line x1={L} x2={W} y1={y(v)} y2={y(v)} className="grid" />
          <text x={0} y={y(v) + 4} className="axis">{v}</text>
        </g>
      ))}
      <line x1={L} x2={W} y1={y(target)} y2={y(target)} className="target" />
      <text x={W} y={y(target) - 4} textAnchor="end" className="axis tgt">hedef {target}</text>
      {['say', 'soz'].map((k) => (
        <g key={k} className={`series ${k}`}>
          <path d={path(k)} fill="none" />
          {pts.map((p, i) => (
            <circle key={p.id} cx={x(i)} cy={y(Number(p[k]) || 0)} r="4">
              <title>{`${sd(p.date)}: ${p[k]}`}</title>
            </circle>
          ))}
        </g>
      ))}
      {pts.map((p, i) =>
        pts.length <= 8 || i % Math.ceil(pts.length / 6) === 0 ? (
          <text key={p.id} x={x(i)} y={H + 26} textAnchor="middle" className="axis">{sd(p.date)}</text>
        ) : null,
      )}
    </svg>
  );
}

export default function Progress({ st, update }) {
  const today = todayStr();
  const mon = mondayOf(today);
  const stats = useMemo(() => weekStats(mon, st), [mon, st]);
  const weeks = useMemo(() => {
    const out = [];
    for (let i = 7; i >= 0; i--) {
      const m = addDays(mon, -7 * i);
      if (m < mondayOf(st.settings.startDate) && i !== 0) continue;
      out.push({ mon: m, pct: weekStats(m, st).pct, current: i === 0 });
    }
    return out;
  }, [mon, st]);
  const counts = useMemo(() => topicCounts(today, st), [today, st]);
  const [f, setF] = useState({ date: today, say: '', soz: '' });

  const setTopic = (id, patch) =>
    update((s) => ({ topics: { ...s.topics, [id]: { status: 0, weak: false, ...s.topics[id], ...patch } } }));

  const addExam = (e) => {
    e.preventDefault();
    if (f.say === '' && f.soz === '') return;
    update((s) => ({ exams: [...s.exams, { id: uid('e'), date: f.date, say: Number(f.say) || 0, soz: Number(f.soz) || 0 }] }));
    setF({ date: today, say: '', soz: '' });
  };
  const exams = [...st.exams].sort((a, b) => (a.date < b.date ? 1 : -1));
  const last = exams[0];

  return (
    <div className="page">
      <header className="hero">
        <div>
          <div className="eyebrow">Takip</div>
          <h1>İlerleme</h1>
        </div>
      </header>

      <section className="card summary">
        <Ring pct={stats.pct} size={72} />
        <div className="sum-body">
          <div className="sum-title">Bu hafta</div>
          <div className="stat-row">
            <div><b>{stats.done}/{stats.total}</b><span>görev</span></div>
            <div><b>{hours(stats.dgsDone)}</b><span>sa DGS</span></div>
            <div><b>{hours(stats.okulDone)}</b><span>sa okul</span></div>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Haftalık tamamlanma</h2>
        <WeekBars data={weeks} />
      </section>

      <section className="card">
        <div className="tl-head">
          <h2>Deneme netleri</h2>
          {last && (
            <span className="muted small">
              Son: Say {last.say} · Söz {last.soz}
            </span>
          )}
        </div>
        {exams.length > 0 ? (
          <>
            <NetChart exams={st.exams} target={st.settings.target} />
            <div className="legend">
              <span className="lg say">Sayısal</span>
              <span className="lg soz">Sözel</span>
            </div>
          </>
        ) : (
          <p className="muted small">İlk denemeni çözünce netlerini buraya gir; grafik oluşacak.</p>
        )}
        <form className="exam-form" onSubmit={addExam}>
          <label>
            Tarih
            <input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
          </label>
          <label>
            Sayısal
            <input inputMode="decimal" type="number" step="0.25" min="0" max="50" value={f.say} onChange={(e) => setF({ ...f, say: e.target.value })} />
          </label>
          <label>
            Sözel
            <input inputMode="decimal" type="number" step="0.25" min="0" max="50" value={f.soz} onChange={(e) => setF({ ...f, soz: e.target.value })} />
          </label>
          <button className="btn primary">Ekle</button>
        </form>
        {exams.length > 0 && (
          <div className="exam-list">
            {exams.map((e) => (
              <div key={e.id} className="exam-row">
                <span>{sd(e.date)}</span>
                <span>Say <b>{e.say}</b></span>
                <span>Söz <b>{e.soz}</b></span>
                <button className="icon-btn sm" aria-label="Sil" onClick={() => update((s) => ({ exams: s.exams.filter((x) => x.id !== e.id) }))}>
                  <Icon name="trash" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {GROUPS.map((g) => {
        const list = TOPICS.filter((t) => t.group === g.id);
        const tw = list.reduce((a, t) => a + t.w, 0);
        const dw = list.reduce((a, t) => a + (st.topics[t.id]?.status === 2 ? t.w : st.topics[t.id]?.status === 1 ? t.w / 2 : 0), 0);
        const pct = Math.round((dw / tw) * 100);
        return (
          <section className="card" key={g.id}>
            <div className="tl-head">
              <h2>{g.name}</h2>
              <span className="muted small">%{pct} · soru ağırlıklı</span>
            </div>
            <div className="pbar"><i style={{ width: `${pct}%` }} /></div>
            <div className="topics">
              {list.map((t) => {
                const s = st.topics[t.id] || { status: 0, weak: false };
                return (
                  <div key={t.id} className={`topic s${s.status}`}>
                    <button className="topic-main" onClick={() => setTopic(t.id, { status: (s.status + 1) % 3 })}>
                      <span className="dot" />
                      <span className="tname">{t.name}</span>
                      <span className="tmeta">
                        ~{String(t.w).replace('.', ',')} soru · {counts[t.id] || 0} oturum · {STATUS[s.status]}
                      </span>
                    </button>
                    <button
                      className={`star ${s.weak ? 'on' : ''}`}
                      onClick={() => setTopic(t.id, { weak: !s.weak })}
                      aria-label="Zayıf konu"
                      aria-pressed={s.weak}
                    >
                      <Icon name="star" />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
      <p className="muted small center">Konuya dokun: durum değişir. ★ zayıf konu: son fazdaki hız çalışmaları bunlara göre seçilir.</p>
    </div>
  );
}
