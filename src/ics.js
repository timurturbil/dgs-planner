import { buildDay, addDays, parseDate } from './schedule.js';

const pad = (n) => String(n).padStart(2, '0');
const utc = (ds, min) => {
  const d = parseDate(ds);
  d.setMinutes(min);
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
};
const esc = (s) => String(s).replace(/[\\;,]/g, (m) => '\\' + m).replace(/\n/g, '\\n');

// Takvime aktarılacak olaylar: evden çıkışlar + çalışma blokları
export function buildIcs(from, days, st) {
  const now = utc(from, 0);
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//DGS Planlayici//TR', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:DGS Programı'];
  let n = 0;
  for (let i = 0; i < days; i++) {
    const ds = addDays(from, i);
    for (const b of buildDay(ds, st).blocks) {
      const leave = b.kind === 'commute' && b.sub.includes('evden çık');
      if (!leave && !b.checkable) continue;
      const alarm = leave ? 15 : 5;
      const uidKey = `${ds}-${b.start}-${b.kind}`;
      lines.push(
        'BEGIN:VEVENT',
        `UID:${uidKey}@dgs-planlayici`,
        `DTSTAMP:${now}`,
        `DTSTART:${utc(ds, b.start)}`,
        `DTEND:${utc(ds, b.end)}`,
        `SUMMARY:${esc(leave ? `🚶 ${b.title}` : `📚 ${b.title}`)}`,
        `DESCRIPTION:${esc(b.sub || '')}`,
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        `DESCRIPTION:${esc(b.title)}`,
        `TRIGGER:-PT${alarm}M`,
        'END:VALARM',
        'END:VEVENT',
      );
      n++;
    }
  }
  lines.push('END:VCALENDAR');
  return { text: lines.join('\r\n'), count: n };
}

const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

// iPhone'da paylaşım menüsü Takvim'i göstermez; .ics doğrudan açılınca Takvim'in "Tümünü Ekle" ekranı gelir
export function openIcs(text, filename) {
  if (isIOS()) {
    window.location.href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(text);
    return;
  }
  return shareOrDownload(text, filename, 'text/calendar');
}

export async function shareOrDownload(text, filename, mime) {
  const blob = new Blob([text], { type: mime });
  const file = new File([blob], filename, { type: mime });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename });
      return;
    } catch (e) {
      if (e?.name === 'AbortError') return;
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
