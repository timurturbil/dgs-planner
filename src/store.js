import { useEffect, useState, useCallback } from 'react';
import { DEFAULT_STATE } from './data.js';

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
  const update = useCallback((fn) => setSt((p) => ({ ...p, ...fn(p) })), []);
  const setSettings = useCallback((fn) => setSt((p) => ({ ...p, settings: { ...p.settings, ...fn(p.settings) } })), []);
  return { st, setSt, update, setSettings };
}
