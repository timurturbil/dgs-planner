import { useEffect, useState, useCallback } from 'react';
import { DEFAULT_STATE } from './data.js';
import { freezePast, todayStr } from './schedule.js';

const KEY = 'dgs-planner-v1';

export function normalize(raw) {
  const d = structuredClone(DEFAULT_STATE);
  if (!raw || typeof raw !== 'object') return d;
  return {
    ...d,
    ...raw,
    settings: { ...d.settings, ...(raw.settings || {}) },
    done: raw.done || {},
    skipped: raw.skipped || {},
    topics: raw.topics || {},
    exams: raw.exams || [],
    frozen: raw.frozen || {},
  };
}

function load() {
  try {
    const s = localStorage.getItem(KEY);
    return normalize(s ? JSON.parse(s) : null);
  } catch {
    return normalize(null);
  }
}

export function useStore() {
  const [st, setSt] = useState(load);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(st));
    } catch {
      /* depolama dolu/kapalı */
    }
  }, [st]);
  useEffect(() => {
    navigator.storage?.persist?.().catch(() => {});
  }, []);
  // Geçen günleri sabitle (açılışta ve gece yarısını geçince)
  useEffect(() => {
    let last = null;
    const tick = () => {
      const t = todayStr();
      if (t === last) return;
      last = t;
      setSt((p) => {
        const frozen = freezePast(p, t);
        return frozen === p.frozen ? p : { ...p, frozen };
      });
    };
    tick();
    const i = setInterval(tick, 60000);
    return () => clearInterval(i);
  }, []);
  const update = useCallback((fn) => setSt((p) => ({ ...p, ...fn(p) })), []);
  const setSettings = useCallback((fn) => setSt((p) => ({ ...p, settings: { ...p.settings, ...fn(p.settings) } })), []);
  return { st, setSt, update, setSettings };
}
