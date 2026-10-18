import { useRef, useState } from 'react';
import { DAY_LONG, DAY_SHORT, uid } from './data.js';
import { buildIcs, openIcs, shareOrDownload } from './ics.js';
import { normalize } from './store.js';
import { mondayOf, todayStr } from './schedule.js';
import { Icon } from './ui.jsx';

const PTYPE = { sinav: 'Vize / final haftası', tatil: 'Tatil (sömestr, bayram…)' };

function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function DaySelect({ value, onChange }) {
  return (
    <select value={value} onChange={(e) => onChange(Number(e.target.value))}>
      {DAY_LONG.map((d, i) => (
        <option key={d} value={i + 1}>{d}</option>
      ))}
    </select>
  );
}

export default function Settings({ st, setSt, setSettings }) {
  const s = st.settings;
  const today = todayStr();
  const [msg, setMsg] = useState('');
  const fileRef = useRef();
  const flash = (m) => {
    setMsg(m);
    setTimeout(() => setMsg(''), 3500);
  };

  // dönemler
  const [pf, setPf] = useState({ type: 'sinav', label: '', start: today, end: today });
  const addPeriod = (e) => {
    e.preventDefault();
    if (pf.end < pf.start) return flash('Bitiş tarihi başlangıçtan önce olamaz');
    setSettings((x) => ({ periods: [...x.periods, { ...pf, id: uid('p'), label: pf.label || (pf.type === 'sinav' ? 'Sınav haftası' : 'Tatil') }] }));
    setPf({ ...pf, label: '' });
  };

  // ders programı
  const sets = [...s.classSets].sort((a, b) => (a.from < b.from ? -1 : 1));
  const [setId, setSetId] = useState(() => {
    const cur = sets.filter((x) => x.from <= today).pop();
    return (cur || sets[0]).id;
  });
  const set = s.classSets.find((x) => x.id === setId) || sets[0];
  const patchSet = (fn) => setSettings((x) => ({ classSets: x.classSets.map((c) => (c.id === set.id ? { ...c, ...fn(c) } : c)) }));
  const [cf, setCf] = useState({ day: 1, start: '09:00', end: '10:00', name: '' });
  const addClass = (e) => {
    e.preventDefault();
    if (!cf.name.trim() || cf.end <= cf.start) return flash('Ders adı ve geçerli saat gir');
    patchSet((c) => ({ classes: [...c.classes, { ...cf, id: uid('c'), name: cf.name.trim() }] }));
    setCf({ ...cf, name: '' });
  };
  const [nf, setNf] = useState({ label: 'Bahar dönemi', from: '2027-02-15', copy: false });
  const addSet = (e) => {
    e.preventDefault();
    const id = uid('s');
    setSettings((x) => ({
      classSets: [...x.classSets, { id, label: nf.label || 'Yeni dönem', from: nf.from, classes: nf.copy ? set.classes.map((c) => ({ ...c, id: uid('c') })) : [] }],
    }));
    setSetId(id);
    flash('Yeni dönem eklendi; derslerini aşağıdan gir');
  };

  // etkinlikler
  const patchAct = (id, p) => setSettings((x) => ({ activities: x.activities.map((a) => (a.id === id ? { ...a, ...p } : a)) }));

  const exportIcs = async (days) => {
    const from = days === 7 ? mondayOf(today) : today;
    const { text, count } = buildIcs(from, days, st);
    await openIcs(text, `dgs-program-${from}.ics`);
    flash(`${count} etkinlik hazırlandı`);
  };
  const exportJson = () => shareOrDownload(JSON.stringify(st, null, 1), `dgs-yedek-${today}.json`, 'application/json');
  const importJson = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    f.text()
      .then((t) => {
        const data = JSON.parse(t);
        if (!data.settings) throw new Error();
        setSt(normalize(data));
        flash('Yedek geri yüklendi');
      })
      .catch(() => flash('Dosya okunamadı'));
    e.target.value = '';
  };

  const byDay = [1, 2, 3, 4, 5, 6, 7].map((d) => set.classes.filter((c) => c.day === d).sort((a, b) => (a.start < b.start ? -1 : 1)));

  return (
    <div className="page">
      <header className="hero">
        <div>
          <div className="eyebrow">Düzenle</div>
          <h1>Ayarlar</h1>
        </div>
      </header>
      {msg && <div className="toast">{msg}</div>}

      <section className="card">
        <h2>Genel</h2>
        <div className="grid2">
          <Field label="Adın">
            <input value={s.name} placeholder="isteğe bağlı" onChange={(e) => setSettings(() => ({ name: e.target.value }))} />
          </Field>
          <Field label="Hedef net (her bölüm)">
            <input type="number" min="1" max="50" value={s.target} onChange={(e) => setSettings(() => ({ target: Number(e.target.value) || 35 }))} />
          </Field>
          <Field label="DGS tarihi">
            <input type="date" value={s.examDate} onChange={(e) => e.target.value && setSettings(() => ({ examDate: e.target.value }))} />
          </Field>
          <Field label="Program başlangıcı">
            <input type="date" value={s.startDate} onChange={(e) => e.target.value && setSettings(() => ({ startDate: e.target.value }))} />
          </Field>
          <Field label="Okul yolu (dk, tek yön)">
            <input type="number" min="0" value={s.commute} onChange={(e) => setSettings(() => ({ commute: Number(e.target.value) || 0 }))} />
          </Field>
          <Field label="Boş gün kalkış">
            <input type="time" value={s.wakeFree} onChange={(e) => e.target.value && setSettings(() => ({ wakeFree: e.target.value }))} />
          </Field>
          <Field label="Okul günü: çıkıştan önce (dk)">
            <input type="number" min="0" value={s.prepMin} onChange={(e) => setSettings(() => ({ prepMin: Number(e.target.value) || 0 }))} />
          </Field>
          <Field label="Uyku saati">
            <input type="time" value={s.bedtime} onChange={(e) => e.target.value && setSettings(() => ({ bedtime: e.target.value }))} />
          </Field>
        </div>
      </section>

      <section className="card">
        <h2>Vize, final ve tatiller</h2>
        <p className="muted small">Sınav haftalarında DGS yarıya iner, okul çalışması artar. Tatillerde okul dersleri kalkar, DGS süresi artar.</p>
        {s.periods.length > 0 && (
          <div className="list">
            {[...s.periods].sort((a, b) => (a.start < b.start ? -1 : 1)).map((p) => (
              <div key={p.id} className={`row ptype-${p.type}`}>
                <div>
                  <b>{p.label}</b>
                  <div className="muted small">{PTYPE[p.type]} · {p.start} → {p.end}</div>
                </div>
                <button className="icon-btn sm" aria-label="Sil" onClick={() => setSettings((x) => ({ periods: x.periods.filter((y) => y.id !== p.id) }))}>
                  <Icon name="trash" />
                </button>
              </div>
            ))}
          </div>
        )}
        <form className="grid2" onSubmit={addPeriod}>
          <Field label="Tür">
            <select value={pf.type} onChange={(e) => setPf({ ...pf, type: e.target.value })}>
              <option value="sinav">{PTYPE.sinav}</option>
              <option value="tatil">{PTYPE.tatil}</option>
            </select>
          </Field>
          <Field label="Ad">
            <input value={pf.label} placeholder={pf.type === 'sinav' ? 'Vize haftası' : 'Sömestr tatili'} onChange={(e) => setPf({ ...pf, label: e.target.value })} />
          </Field>
          <Field label="Başlangıç">
            <input type="date" value={pf.start} onChange={(e) => setPf({ ...pf, start: e.target.value })} />
          </Field>
          <Field label="Bitiş">
            <input type="date" value={pf.end} onChange={(e) => setPf({ ...pf, end: e.target.value })} />
          </Field>
          <button className="btn primary span2">Dönem ekle</button>
        </form>
      </section>

      <section className="card">
        <h2>Ders programı</h2>
        <div className="seg">
          {sets.map((x) => (
            <button key={x.id} className={x.id === set.id ? 'on' : ''} onClick={() => setSetId(x.id)}>
              {x.label}
            </button>
          ))}
        </div>
        <div className="grid2">
          <Field label="Dönem adı">
            <input value={set.label} onChange={(e) => patchSet(() => ({ label: e.target.value }))} />
          </Field>
          <Field label="Geçerli olduğu tarih">
            <input type="date" value={set.from} onChange={(e) => e.target.value && patchSet(() => ({ from: e.target.value }))} />
          </Field>
        </div>
        <div className="classes">
          {byDay.map((list, i) =>
            list.length ? (
              <div key={i} className="cday">
                <div className="cday-name">{DAY_SHORT[i]}</div>
                <div className="cday-list">
                  {list.map((c) => (
                    <div key={c.id} className="crow">
                      <span className="ctime">{c.start}–{c.end}</span>
                      <span className="cname">{c.name}</span>
                      <button className="icon-btn sm" aria-label="Sil" onClick={() => patchSet((x) => ({ classes: x.classes.filter((y) => y.id !== c.id) }))}>
                        <Icon name="trash" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null,
          )}
          {set.classes.length === 0 && <p className="muted small">Bu dönemde henüz ders yok.</p>}
        </div>
        <form className="grid2" onSubmit={addClass}>
          <Field label="Gün">
            <DaySelect value={cf.day} onChange={(day) => setCf({ ...cf, day })} />
          </Field>
          <Field label="Ders adı">
            <input value={cf.name} onChange={(e) => setCf({ ...cf, name: e.target.value })} />
          </Field>
          <Field label="Başlangıç">
            <input type="time" value={cf.start} onChange={(e) => setCf({ ...cf, start: e.target.value })} />
          </Field>
          <Field label="Bitiş">
            <input type="time" value={cf.end} onChange={(e) => setCf({ ...cf, end: e.target.value })} />
          </Field>
          <button className="btn primary span2">Ders ekle</button>
        </form>
        <details className="sub-form">
          <summary>Yeni dönem programı (ör. bahar)</summary>
          <form className="grid2" onSubmit={addSet}>
            <Field label="Ad">
              <input value={nf.label} onChange={(e) => setNf({ ...nf, label: e.target.value })} />
            </Field>
            <Field label="Başlangıç tarihi">
              <input type="date" value={nf.from} onChange={(e) => setNf({ ...nf, from: e.target.value })} />
            </Field>
            <label className="check-line span2">
              <input type="checkbox" checked={nf.copy} onChange={(e) => setNf({ ...nf, copy: e.target.checked })} /> Seçili dönemin derslerini kopyala
            </label>
            <button className="btn span2">Dönemi oluştur</button>
          </form>
        </details>
      </section>

      <section className="card">
        <h2>Spor ve sabit etkinlikler</h2>
        <p className="muted small">Evden çıkış ve eve dönüş saatlerine göre yol süresi hesaplanır. Eve dönüş 23:00 sonrasıysa o gün çalışma planlanmaz.</p>
        {s.activities.map((a) => (
          <div key={a.id} className="act">
            <div className="act-top">
              <input className="act-name" value={a.name} onChange={(e) => patchAct(a.id, { name: e.target.value })} />
              <DaySelect value={a.day} onChange={(day) => patchAct(a.id, { day })} />
              <button className="icon-btn sm" aria-label="Sil" onClick={() => setSettings((x) => ({ activities: x.activities.filter((y) => y.id !== a.id) }))}>
                <Icon name="trash" />
              </button>
            </div>
            <div className="act-times">
              {[
                ['leave', 'Çıkış'],
                ['start', 'Başlar'],
                ['end', 'Biter'],
                ['back', 'Dönüş'],
              ].map(([k, l]) => (
                <Field key={k} label={l}>
                  <input type="time" value={a[k] === '24:00' ? '00:00' : a[k]} onChange={(e) => e.target.value && patchAct(a.id, { [k]: k === 'back' && e.target.value === '00:00' ? '24:00' : e.target.value })} />
                </Field>
              ))}
              <Field label="Dinlenme dk">
                <input type="number" min="0" value={a.rest} onChange={(e) => patchAct(a.id, { rest: Number(e.target.value) || 0 })} />
              </Field>
            </div>
          </div>
        ))}
        <button
          className="btn"
          onClick={() => setSettings((x) => ({ activities: [...x.activities, { id: uid('a'), name: 'Yeni etkinlik', day: 2, leave: '17:00', start: '17:30', end: '18:30', back: '19:00', rest: 60 }] }))}
        >
          + Etkinlik ekle
        </button>
      </section>

      <section className="card">
        <h2>Telefon takvimine aktar</h2>
        <p className="muted small">
          Evden çıkış ve çalışma saatleri, hatırlatmalarıyla birlikte takvime eklenir (çıkıştan 15 dk, çalışmadan 5 dk önce). Program değişirse
          tekrar aktar. iPhone’da açılan ekranda “Tümünü ekle”yi seç.
        </p>
        <div className="btns">
          <button className="btn primary" onClick={() => exportIcs(7)}>Bu hafta</button>
          <button className="btn" onClick={() => exportIcs(28)}>Önümüzdeki 4 hafta</button>
        </div>
      </section>

      <section className="card">
        <h2>Yedekleme</h2>
        <p className="muted small">Tüm veriler sadece bu telefonda durur. Ara sıra yedek alıp dosyayı sakla.</p>
        <div className="btns">
          <button className="btn primary" onClick={exportJson}>Yedeği indir</button>
          <button className="btn" onClick={() => fileRef.current?.click()}>Yedekten yükle</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={importJson} />
        </div>
      </section>

      <section className="card danger">
        <h2>Sıfırla</h2>
        <button
          className="btn warn"
          onClick={() => {
            if (confirm('Tüm ilerleme ve ayarlar silinecek. Emin misin?')) {
              setSt(normalize(null));
              flash('Sıfırlandı');
            }
          }}
        >
          Her şeyi sıfırla
        </button>
      </section>
    </div>
  );
}
