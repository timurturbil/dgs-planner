// node --test: görev kimliklerinin ayar değişikliklerinden etkilenmemesi
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize } from './store.js';
import { buildDay, freezeDays, freezePast, isStale } from './schedule.js';

const TUE = '2026-11-17'; // Salı: Fitness günü
const today = '2026-11-20';
// Boş gün kalkışını öne almak Salı'ya ek bir blok sokar ve sonraki kimlikleri kaydırır
const withAct = (st) => ({ ...st, settings: { ...st.settings, wakeFree: '06:30' } });
const titleOf = (st, id) => buildDay(id.split('#')[0], st).tasks.find((t) => t.id === id)?.title;

test('sabitlenmemiş gün: ayar değişince kimlik başka göreve kayar (sorunun kendisi)', () => {
  const st = normalize(null);
  const id = buildDay(TUE, st).tasks[3].id;
  assert.notEqual(titleOf(st, id), titleOf(withAct(st), id));
});

test('geçmiş gün sabitlenince ayar değişikliği işaretleri bozmaz', () => {
  let st = normalize(null);
  st = { ...st, frozen: freezePast(st, today) };
  const tasks = buildDay(TUE, st).tasks;
  const changed = withAct(st);
  for (const t of tasks) assert.equal(titleOf(changed, t.id), t.title);
  assert.ok(isStale(TUE, changed));
  assert.ok(!isStale(TUE, st));
});

test('freezeDays değişiklik yoksa aynı nesneyi döndürür', () => {
  let st = normalize(null);
  st = { ...st, frozen: freezeDays(st, [TUE]) };
  assert.equal(freezeDays(st, [TUE]), st.frozen);
});

test('sabit günden sonraki günler zinciri bozulmadan hesaplanır', () => {
  const st = normalize(null);
  const fresh = buildDay('2026-11-18', st).tasks.map((t) => t.title);
  const fz = { ...st, frozen: freezeDays(st, [TUE]) };
  assert.deepEqual(buildDay('2026-11-18', fz).tasks.map((t) => t.title), fresh);
});

test('sabit gün JSON ile kaydedilip geri yüklenince aynı kalır', () => {
  let st = normalize(null);
  st = { ...st, frozen: freezePast(st, today) };
  const back = normalize(JSON.parse(JSON.stringify(st)));
  assert.deepEqual(buildDay(TUE, back).tasks, buildDay(TUE, st).tasks);
});
