// Program motoru: bir gün için zaman bloklarını üretir
import { PHASE1, PHASE2, LOGIC_TYPES, TOPIC, TOPICS } from './data.js';

const pad = (n) => String(n).padStart(2, '0');
export const toMin = (s) => {
  const [h, m] = String(s).split(':').map(Number);
  return h * 60 + (m || 0);
};
export const fmt = (m) => {
  const x = ((m % 1440) + 1440) % 1440;
  return `${pad(Math.floor(x / 60))}:${pad(x % 60)}`;
};
export const parseDate = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const fmtDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const addDays = (s, n) => {
  const d = parseDate(s);
  d.setDate(d.getDate() + n);
  return fmtDate(d);
};
export const weekday = (s) => ((parseDate(s).getDay() + 6) % 7) + 1; // 1=Pzt..7=Paz
export const mondayOf = (s) => addDays(s, 1 - weekday(s));
export const todayStr = () => fmtDate(new Date());
const DAY = 86400000;
export const daysBetween = (a, b) => Math.round((parseDate(b) - parseDate(a)) / DAY);

export function getPeriod(ds, periods) {
  const hits = (periods || []).filter((p) => p.start <= ds && ds <= p.end);
  return hits.find((p) => p.type === 'sinav') || hits[0] || null;
}

export function classesFor(ds, s) {
  const sets = [...s.classSets].filter((c) => c.from <= ds).sort((a, b) => (a.from < b.from ? 1 : -1));
  const set = sets[0] || s.classSets[0];
  const wd = weekday(ds);
  return set ? set.classes.filter((c) => c.day === wd) : [];
}

// ---- Fazlar ve haftalık konu planı ----
export function weekPlan(ds, st) {
  const s = st.settings;
  const start = mondayOf(s.startDate);
  const examMon = mondayOf(s.examDate);
  const total = Math.max(1, daysBetween(start, examMon) / 7 + 1);
  const wi = Math.floor(daysBetween(start, mondayOf(ds)) / 7);
  const p3 = Math.max(1, Math.min(9, Math.round(total * 0.23)));
  const p2 = Math.max(1, Math.min(9, Math.round(total * 0.23)));
  const p1 = Math.max(1, total - p2 - p3);
  const weak = TOPICS.filter((t) => st.topics[t.id]?.weak).map((t) => t.id);
  const base = { weekNo: wi + 1, totalWeeks: total, wi };
  if (ds > s.examDate) return { ...base, phase: 4, label: 'Sınav sonrası' };
  if (wi < 0) return { ...base, phase: 0, label: 'Başlangıç öncesi', ...PHASE1[0], geo: [] };
  if (wi < p1) {
    const e = PHASE1[Math.min(PHASE1.length - 1, Math.floor((wi * PHASE1.length) / p1))];
    return { ...base, phase: 1, phaseWeek: wi + 1, phaseLen: p1, label: 'Temel konular', mat: e.mat, tr: e.tr, geo: [], review: e.review };
  }
  if (wi < p1 + p2) {
    const k = wi - p1;
    const e = PHASE2[Math.min(PHASE2.length - 1, Math.floor((k * PHASE2.length) / p2))];
    return { ...base, phase: 2, phaseWeek: k + 1, phaseLen: p2, label: 'Problem + mantık', mat: e.mat, tr: e.tr, geo: e.geo };
  }
  const k = wi - p1 - p2;
  const pool = weak.length ? weak : ['sayikesir', 'tablo', 'yuzde', 'aci', 'cumle', 'uslu', 'basamak', 'dortgen'];
  const pick = (n, off) => Array.from({ length: n }, (_, i) => pool[(k * 2 + i + off) % pool.length]);
  const focus = [...new Set(pick(3, 0))];
  return {
    ...base, phase: 3, phaseWeek: k + 1, phaseLen: p3, label: 'Deneme + hız',
    mat: focus.filter((t) => TOPIC[t].group !== 'tr'), tr: focus.find((t) => TOPIC[t].group === 'tr') || ['cumle', 'paragraf', 'szmantik'][k % 3],
    geo: [], focus, weakUsed: weak.length > 0,
  };
}

const isDenemeDay = (wd, plan) => {
  if (plan.phase === 1) return wd === 7 && plan.wi % 2 === 1;
  if (plan.phase === 2) return wd === 7;
  if (plan.phase === 3) return wd === 7 || wd === 2;
  return false;
};

const ROT = { 0: ['mat', 'tr', 'mantik', 'mat', 'tr'], 1: ['mat', 'tr', 'mantik', 'mat', 'tr'], 2: ['problem', 'mantik', 'tr', 'geo', 'tr', 'mantik'], 3: ['hiz', 'tr', 'mantik', 'hiz', 'tr'] };

function labelDgs(it, n, plan) {
  const at = (arr, i) => arr[((i % arr.length) + arr.length) % arr.length];
  if (it.kind === 'paragraf') return { title: 'Günlük paragraf', sub: '10 paragraf sorusu · yanlışların nedenini not et', topic: 'paragraf' };
  if (it.kind === 'deneme') return { title: 'Deneme sınavı', sub: '150 dk · 100 soru · gerçek sınav koşulları', topic: null };
  if (it.kind === 'analiz') return { title: 'Deneme analizi', sub: 'Yanlış ve boşları konu bazında ayır, neti kaydet', topic: null };
  if (it.len < 60) {
    const t = plan.mat?.[0];
    return { title: 'Kısa tekrar', sub: t ? `${TOPIC[t].name} · 15 soru` : 'Bu haftanın konuları', topic: t || null };
  }
  const rot = ROT[plan.phase] || ROT[1];
  const type = at(rot, n);
  if (type === 'mantik') return { title: `Sayısal mantık · ${at(LOGIC_TYPES, n + plan.wi)}`, sub: '15–20 soru · önce soru tipini tanı', topic: 'smantik' };
  if (type === 'tr') {
    const t = plan.tr;
    return { title: `Türkçe · ${TOPIC[t].name}`, sub: t === 'szmantik' ? '15–20 soru · tablo kurarak çöz' : '30–40 soru · şık eleme mantığını yaz', topic: t };
  }
  if (type === 'geo' && plan.geo?.length) {
    const t = at(plan.geo, n);
    return { title: `Geometri · ${TOPIC[t].name}`, sub: 'Soru tipleri + kısa yollar · 25 soru', topic: t };
  }
  const t = at(plan.mat?.length ? plan.mat : ['sayikesir'], Math.floor(n / rot.length) + n);
  if (type === 'hiz') return { title: `Hız çalışması · ${TOPIC[t].name}`, sub: 'Süre tut · 20 soru · takılınca işaretle geç', topic: t };
  if (type === 'problem') return { title: `Problem çözümü · ${TOPIC[t].name}`, sub: 'Farklı zorlukta 40 soru', topic: t };
  return {
    title: `Matematik · ${TOPIC[t].name}`,
    sub: plan.review ? 'Genel tekrar · 30 soru' : 'Konu anlatımı + 30 soru · yanlış analizi',
    topic: t,
  };
}

const cache = new Map();
const sig = { s: null, t: null, f: null };

// Bir günün programı (ayarlar/konular/sabit günler değişmedikçe önbellekten).
// Sabitlenmiş (frozen) günler ayarlardan yeniden hesaplanmaz: görev kimlikleri
// sıraya bağlı olduğu için, aksi halde ayar değişince geçmiş işaretler kayardı.
export function buildDay(ds, st) {
  if (sig.s !== st.settings || sig.t !== st.topics || sig.f !== st.frozen) {
    cache.clear();
    sig.s = st.settings;
    sig.t = st.topics;
    sig.f = st.frozen;
  }
  if (cache.has(ds)) return cache.get(ds);
  const snap = st.frozen?.[ds];
  const res = snap ? { ...snap, tasks: snap.blocks.filter((b) => b.checkable), frozen: true } : _buildDay(ds, st);
  cache.set(ds, res);
  return res;
}

// Sabit gün yok sayılarak, güncel ayarlarla hesaplanan program
export const buildDayFresh = (ds, st) => _buildDay(ds, st);

const snapOf = (d) => {
  const { tasks, frozen, ...rest } = d;
  return rest;
};

// Verilen günleri o anki halleriyle sabitler; değişiklik yoksa aynı nesneyi döndürür
export function freezeDays(st, days) {
  const add = days.filter((ds) => !st.frozen?.[ds]);
  if (!add.length) return st.frozen;
  const out = { ...st.frozen };
  for (const ds of add.sort()) out[ds] = snapOf(buildDay(ds, st));
  return out;
}

// Başlangıçtan düne kadar sabitlenmemiş günleri sabitler
export function freezePast(st, today = todayStr()) {
  const days = [];
  for (let ds = st.settings.startDate; ds < today; ds = addDays(ds, 1)) days.push(ds);
  return freezeDays(st, days);
}

// Sabit gün güncel ayarlardan farklı mı? (yeniden planlama önerisi için)
export function isStale(ds, st) {
  const snap = st.frozen?.[ds];
  if (!snap) return false;
  const key = (bs) => JSON.stringify(bs.map((b) => [b.start, b.end, b.kind, b.title]));
  return key(snap.blocks) !== key(buildDayFresh(ds, st).blocks);
}

function _buildDay(ds, st) {
  const s = st.settings;
  const wd = weekday(ds);
  const period = getPeriod(ds, s.periods);
  const mode = period?.type || null;
  const plan = weekPlan(ds, st);
  let offset = 0;
  if (wd > 1) {
    const prev = buildDay(addDays(ds, -1), st);
    offset = (prev.offset || 0) + (prev.count || 0);
  }
  const blocks = [];
  const add = (start, end, kind, title, sub = '') => {
    if (end > start) blocks.push({ start, end, kind, title, sub });
  };
  const C = Number(s.commute) || 0;
  const studyEnd = toMin(s.studyEnd);

  if (ds === s.examDate) {
    add(toMin('07:00'), toMin('08:00'), 'meal', 'Kahvaltı', 'Hafif ve erken');
    add(toMin('10:15'), toMin('12:45'), 'deneme', 'DGS SINAVI', 'Başarılar! Takılınca işaretle, geç.');
    return finalize(ds, blocks, { mode, period, plan, wake: toMin('07:00'), bed: toMin(s.bedtime) });
  }

  // Okul
  const raw = mode === 'tatil' ? [] : classesFor(ds, s);
  const cs = raw.map((c) => ({ ...c, S: toMin(c.start), E: toMin(c.end) })).sort((a, b) => a.S - b.S);
  // ardışık aynı dersleri birleştir
  const merged = [];
  for (const c of cs) {
    const last = merged[merged.length - 1];
    if (last && last.name === c.name && last.E === c.S) last.E = c.E;
    else merged.push({ ...c });
  }
  const windows = []; // boş zaman pencereleri
  let schoolLeave = null;
  let schoolHome = null;
  if (merged.length) {
    schoolLeave = merged[0].S - C;
    add(schoolLeave, merged[0].S, 'commute', 'Okula yol', `${fmt(schoolLeave)}'da evden çık`);
    let prevEnd = null;
    for (const c of merged) {
      if (prevEnd != null && c.S > prevEnd) {
        const g = c.S - prevEnd;
        if (g >= 180) {
          add(prevEnd, prevEnd + 30, 'gap', 'Öğle arası', 'Okulda');
          const w = { s: prevEnd + 30, e: prevEnd + 30 + Math.min(120, g - 30), dgsOnly: true };
          windows.push(w);
          add(w.e, c.S, 'gap', 'Ders arası', 'Dinlenme');
        } else add(prevEnd, c.S, 'gap', 'Ders arası', 'Öğle yemeği / dinlenme');
      }
      add(c.S, c.E, 'class', c.name, 'Okul');
      prevEnd = Math.max(prevEnd ?? 0, c.E);
    }
    schoolHome = prevEnd + C;
    add(prevEnd, schoolHome, 'commute', 'Eve dönüş', 'Okuldan');
  }

  // Sporlar
  const acts = s.activities
    .filter((a) => Number(a.day) === wd)
    .map((a) => ({ ...a, L: toMin(a.leave), S: toMin(a.start), E: toMin(a.end), B: toMin(a.back) }))
    .sort((a, b) => a.L - b.L);
  let dayEnd = studyEnd;
  for (const a of acts) {
    add(a.L, a.S, 'commute', `${a.name} yolu`, `${fmt(a.L)}'da evden çık`);
    add(a.S, a.E, 'sport', a.name);
    add(a.E, a.B, 'commute', 'Eve dönüş', a.name);
    if (a.B >= studyEnd) dayEnd = Math.min(dayEnd, a.L);
    else if (Number(a.rest) > 0) add(a.B, a.B + Number(a.rest), 'rest', 'Dinlenme & yemek', 'Spordan sonra');
  }

  // Okul dönüşü dinlenme
  if (schoolHome != null && schoolHome < dayEnd) {
    add(schoolHome, Math.min(schoolHome + 60, dayEnd), 'rest', 'Dinlenme & yemek', 'Okuldan sonra');
  }

  // Uyanış ve sabah
  let wake = toMin(s.wakeFree);
  if (schoolLeave != null) wake = Math.min(wake, schoolLeave - Number(s.prepMin));
  if (acts.length) wake = Math.min(wake, acts[0].L - 60);
  const firstOut = Math.min(schoolLeave ?? 9999, acts[0]?.L ?? 9999);
  if (firstOut - wake <= 90) add(wake, firstOut, 'meal', 'Hazırlık & kahvaltı');
  else add(wake, wake + 60, 'meal', 'Kahvaltı');

  // Evdeki boş pencereler
  const busy = [...blocks, ...windows.map((w) => ({ start: w.s, end: w.e }))].sort((a, b) => a.start - b.start);
  let cur = wake;
  for (const b of busy) {
    if (b.start > cur && cur < dayEnd) windows.push({ s: cur, e: Math.min(b.start, dayEnd) });
    cur = Math.max(cur, b.end);
  }
  if (cur < dayEnd) windows.push({ s: cur, e: dayEnd });

  // Öğün ekle
  const hasMeal = (a, b) => blocks.some((x) => ['meal', 'rest', 'gap'].includes(x.kind) && x.start < b && x.end > a);
  const placeMeal = (from, to, pref, title) => {
    if (hasMeal(from, to)) return;
    const w = windows.find((w) => !w.dgsOnly && w.s <= pref && w.e >= pref + 60) ||
      windows.find((w) => !w.dgsOnly && Math.min(w.e, to) - Math.max(w.s, from) >= 60);
    if (!w) return;
    const st0 = w.s <= pref && w.e >= pref + 60 ? pref : Math.max(w.s, from);
    add(st0, st0 + 60, 'meal', title);
    windows.splice(windows.indexOf(w), 1, { s: w.s, e: st0 }, { s: st0 + 60, e: w.e });
  };
  placeMeal(toMin('11:30'), toMin('15:00'), toMin('13:00'), 'Öğle yemeği');
  placeMeal(toMin('17:30'), toMin('21:00'), toMin('19:00'), 'Akşam yemeği');

  const wins = windows.filter((w) => w.e - w.s >= 30).sort((a, b) => a.s - b.s);
  const capacity = wins.reduce((a, w) => a + w.e - w.s, 0);

  // Hedefler
  const full = merged.length === 0 && acts.length === 0;
  let dgs = full ? 420 : 300;
  let school = 60;
  if (mode === 'sinav') {
    dgs = Math.round((dgs * 0.5) / 30) * 30;
    school = 180;
  } else if (mode === 'tatil') {
    dgs = full ? 450 : 420;
    school = 0;
  }
  if (plan.phase === 4) {
    dgs = 0;
    school = mode === 'tatil' ? 0 : 60;
  }
  const homeCap = wins.filter((w) => !w.dgsOnly).reduce((a, w) => a + w.e - w.s, 0);
  school = Math.min(school, homeCap);
  if (capacity < dgs + school) {
    if (mode === 'sinav') school = Math.min(school, Math.max(0, capacity - 30));
    dgs = Math.max(dgs ? 30 : 0, Math.min(dgs, capacity - school));
  }

  const items = [];
  let rem = dgs;
  if (rem > 0 && isDenemeDay(wd, plan) && rem >= 150 && wins.some((w) => w.e - w.s >= 150)) {
    items.push({ kind: 'deneme', len: 150, min: 150 });
    rem -= 150;
    if (rem >= 30) {
      items.push({ kind: 'analiz', len: Math.min(60, rem), min: 30 });
      rem -= Math.min(60, rem);
    }
  } else if (rem >= 30) {
    items.push({ kind: 'paragraf', len: 30, min: 30, brk: 0 });
    rem -= 30;
  }
  while (rem >= 30) {
    const l = Math.min(90, rem);
    items.push({ kind: 'dgs', len: l, min: 30 });
    rem -= l;
  }
  let sr = school;
  while (sr >= 30) {
    const l = Math.min(sr, mode === 'sinav' ? 90 : 60);
    items.push({ kind: 'okul', len: l, min: 30 });
    sr -= l;
  }

  let i = 0;
  let j = 0;
  for (const w of wins) {
    let c = w.s;
    while (i < items.length) {
      const it = items[i];
      if (w.dgsOnly && it.kind === 'okul') break;
      const avail = w.e - c;
      let len;
      let rest = 0;
      if (avail >= it.len) len = it.len;
      else if (avail >= it.min) {
        len = avail;
        rest = it.len - avail;
      } else break;
      const kind = it.kind === 'okul' ? 'okul' : it.kind === 'deneme' || it.kind === 'analiz' ? 'deneme' : 'dgs';
      if (kind === 'okul') {
        add(c, c + len, 'okul', mode === 'sinav' ? `${period.label || 'Sınav'} hazırlığı` : 'Okul dersleri', mode === 'sinav' ? 'Okul sınavlarına çalış' : 'Ödev ve ders tekrarı');
      } else {
        const lb = it.lb || labelDgs({ ...it, len: it.orig || it.len }, offset + j, plan);
        if (!it.lb && it.kind === 'dgs') j++;
        it.lb = lb;
        blocks.push({ start: c, end: c + len, kind, title: lb.title, sub: (it.cont ? 'Devamı · ' : '') + lb.sub + (w.dgsOnly ? ' · okulda' : ''), topic: lb.topic });
      }
      c += len + (it.brk ?? 15);
      if (rest >= 30 && it.min < it.len) items[i] = { ...it, len: rest, orig: it.orig || it.len, cont: true };
      else i++;
      if (c >= w.e) break;
    }
  }

  return finalize(ds, blocks, { mode, period, plan, wake, offset, count: j, bed: Math.max(toMin(s.bedtime), ...acts.map((a) => a.B)) });
}

const CHECK = new Set(['dgs', 'okul', 'deneme']);
function finalize(ds, blocks, meta) {
  blocks.sort((a, b) => a.start - b.start);
  let k = 0;
  for (const b of blocks) {
    if (CHECK.has(b.kind)) {
      b.id = `${ds}#${k++}`;
      b.checkable = true;
    }
  }
  const tasks = blocks.filter((b) => b.checkable);
  return { ds, blocks, tasks, ...meta };
}

export function weekDays(monday) {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function weekStats(monday, st) {
  let total = 0, done = 0, dgsPlan = 0, dgsDone = 0, okulPlan = 0, okulDone = 0;
  for (const ds of weekDays(monday)) {
    for (const t of buildDay(ds, st).tasks) {
      const len = t.end - t.start;
      const ok = !!st.done[t.id];
      total++;
      if (ok) done++;
      if (t.kind === 'okul') {
        okulPlan += len;
        if (ok) okulDone += len;
      } else {
        dgsPlan += len;
        if (ok) dgsDone += len;
      }
    }
  }
  return { total, done, pct: total ? Math.round((done / total) * 100) : 0, dgsPlan, dgsDone, okulPlan, okulDone };
}

// Geçmiş günlerden tamamlanmamış görevler (son 21 gün)
export function backlog(today, st) {
  const out = [];
  const from = st.settings.startDate > addDays(today, -21) ? st.settings.startDate : addDays(today, -21);
  for (let ds = from; ds < today; ds = addDays(ds, 1)) {
    for (const t of buildDay(ds, st).tasks) if (!st.done[t.id] && !st.skipped[t.id]) out.push(t);
  }
  return out;
}

export function topicCounts(today, st) {
  const cnt = {};
  for (let ds = st.settings.startDate; ds <= today; ds = addDays(ds, 1)) {
    for (const t of buildDay(ds, st).tasks) if (t.topic && st.done[t.id]) cnt[t.topic] = (cnt[t.topic] || 0) + 1;
  }
  return cnt;
}
