// Sabit veriler: konular, haftalık müfredat, varsayılan ayarlar

export const DAY_SHORT = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
export const DAY_LONG = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
export const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

// w = son 5 yıl ortalama soru sayısı
export const TOPICS = [
  { id: 'temel', name: 'Temel Kavramlar', group: 'mat', w: 1 },
  { id: 'tekcift', name: 'Tek ve Çift Sayılar', group: 'mat', w: 1 },
  { id: 'faktoriyel', name: 'Faktöriyel', group: 'mat', w: 0.8 },
  { id: 'rasyonel', name: 'Rasyonel Sayılar', group: 'mat', w: 1.4 },
  { id: 'basamak', name: 'Basamak Kavramı', group: 'mat', w: 1.8 },
  { id: 'bolme', name: 'Bölme ve Bölünebilme', group: 'mat', w: 1.2 },
  { id: 'esitsizlik', name: 'Basit Eşitsizlikler', group: 'mat', w: 1.8 },
  { id: 'mutlak', name: 'Mutlak Değer', group: 'mat', w: 1 },
  { id: 'uslu', name: 'Üslü Sayılar', group: 'mat', w: 2 },
  { id: 'koklu', name: 'Köklü Sayılar', group: 'mat', w: 1.2 },
  { id: 'carpan', name: 'Çarpanlar ve Denklem', group: 'mat', w: 0.6 },
  { id: 'sayikesir', name: 'Problemler (Sayı-Kesir)', group: 'mat', w: 4.6 },
  { id: 'yas', name: 'Yaş Problemleri', group: 'mat', w: 1 },
  { id: 'hiz', name: 'Hız-Hareket Problemleri', group: 'mat', w: 1 },
  { id: 'yuzde', name: 'Yüzde / Kâr / Zarar', group: 'mat', w: 1.8 },
  { id: 'tablo', name: 'Tablo-Grafik Problemleri', group: 'mat', w: 2.2 },
  { id: 'rutin', name: 'Rutin Olmayan Problemler', group: 'mat', w: 1 },
  { id: 'kumeler', name: 'Kümeler', group: 'mat', w: 1 },
  { id: 'fonksiyon', name: 'Fonksiyonlar', group: 'mat', w: 0.8 },
  { id: 'pko', name: 'Permütasyon-Kombinasyon-Olasılık', group: 'mat', w: 1.6 },
  { id: 'islem', name: 'İşlem & Mod', group: 'mat', w: 0.6 },
  { id: 'smantik', name: 'Sayısal Mantık', group: 'mat', w: 12.8 },
  { id: 'aci', name: 'Açılar – Üçgenler', group: 'geo', w: 2 },
  { id: 'dortgen', name: 'Dörtgenler – Çokgenler', group: 'geo', w: 2 },
  { id: 'cember', name: 'Çember – Daire', group: 'geo', w: 1 },
  { id: 'kati', name: 'Katı Cisimler – Analitik', group: 'geo', w: 2 },
  { id: 'geomantik', name: 'Geometri Mantık', group: 'geo', w: 1 },
  { id: 'sozcuk', name: 'Sözcükte Anlam', group: 'tr', w: 3.8 },
  { id: 'cumle', name: 'Cümlede Anlam', group: 'tr', w: 16.8 },
  { id: 'paragraf', name: 'Paragraf Yorumlama', group: 'tr', w: 22 },
  { id: 'szmantik', name: 'Sözel Mantık', group: 'tr', w: 7.4 },
];
export const TOPIC = Object.fromEntries(TOPICS.map((t) => [t.id, t]));
export const GROUPS = [
  { id: 'mat', name: 'Matematik' },
  { id: 'geo', name: 'Geometri' },
  { id: 'tr', name: 'Türkçe' },
];

// Faz 1 (temel konular) — hafta hafta konu sırası. Faz uzunluğuna göre orantılı yayılır.
export const PHASE1 = [
  { mat: ['temel', 'tekcift'], tr: 'sozcuk' },
  { mat: ['faktoriyel', 'bolme'], tr: 'sozcuk' },
  { mat: ['rasyonel', 'basamak'], tr: 'cumle' },
  { mat: ['esitsizlik', 'mutlak'], tr: 'cumle' },
  { mat: ['uslu'], tr: 'cumle' },
  { mat: ['koklu', 'carpan'], tr: 'cumle' },
  { mat: ['sayikesir'], tr: 'paragraf' },
  { mat: ['sayikesir', 'yas'], tr: 'paragraf' },
  { mat: ['hiz', 'yuzde'], tr: 'paragraf' },
  { mat: ['yuzde', 'tablo'], tr: 'szmantik' },
  { mat: ['rutin', 'kumeler'], tr: 'szmantik' },
  { mat: ['fonksiyon', 'islem'], tr: 'szmantik' },
  { mat: ['pko'], tr: 'paragraf' },
  { mat: ['aci'], tr: 'cumle' },
  { mat: ['aci', 'dortgen'], tr: 'paragraf' },
  { mat: ['dortgen'], tr: 'sozcuk' },
  { mat: ['cember'], tr: 'paragraf' },
  { mat: ['kati'], tr: 'szmantik' },
  { mat: ['geomantik', 'kati'], tr: 'paragraf' },
  { mat: ['sayikesir', 'tablo', 'uslu'], tr: 'cumle', review: true },
];

// Faz 2 (yoğun problem + mantık) — haftalık odak
export const PHASE2 = [
  { mat: ['sayikesir'], geo: ['aci'], tr: 'cumle' },
  { mat: ['yuzde', 'yas'], geo: ['dortgen'], tr: 'paragraf' },
  { mat: ['hiz', 'rutin'], geo: ['cember'], tr: 'szmantik' },
  { mat: ['tablo'], geo: ['kati'], tr: 'cumle' },
  { mat: ['sayikesir', 'kumeler'], geo: ['geomantik'], tr: 'paragraf' },
  { mat: ['basamak', 'esitsizlik'], geo: ['aci', 'dortgen'], tr: 'szmantik' },
  { mat: ['uslu', 'koklu'], geo: ['cember', 'kati'], tr: 'cumle' },
  { mat: ['pko', 'rasyonel'], geo: ['aci'], tr: 'sozcuk' },
  { mat: ['sayikesir', 'tablo', 'yuzde'], geo: ['dortgen'], tr: 'paragraf' },
];

export const LOGIC_TYPES = ['Sıralama', 'Gruplama / eşleştirme', 'Tablo okuma', 'Doğru-yanlış ifadeler', 'Şifreleme / örüntü', 'Karışık set'];

let _id = 0;
const uid = (p) => `${p}${Date.now().toString(36)}${(_id++).toString(36)}`;
export { uid };

const cls = (day, start, end, name) => ({ id: uid('c'), day, start, end, name });

export const DEFAULT_SETTINGS = {
  name: '',
  startDate: '2026-10-19',
  examDate: '2027-07-18',
  target: 35,
  commute: 90, // okul yolu (dk, tek yön)
  prepMin: 90, // okul günü: çıkıştan kaç dk önce kalkar
  wakeFree: '09:00',
  studyEnd: '23:00',
  bedtime: '23:30',
  classSets: [
    {
      id: 'güz',
      label: '2026-27 Güz',
      from: '2026-09-14',
      classes: [
        cls(1, '10:00', '12:00', 'İstatistik'),
        cls(1, '12:00', '13:00', 'Et ve Ürünleri Teknolojisi'),
        cls(1, '15:00', '17:00', 'Et ve Ürünleri Teknolojisi'),
        cls(3, '08:00', '11:00', 'Meyve Sebze Ürünleri Analizleri'),
        cls(3, '14:00', '16:00', 'Su Ürünleri Teknolojisi'),
        cls(3, '16:00', '17:00', 'Süt ve Ürünleri Teknolojisi'),
        cls(4, '11:00', '13:00', 'Mesleki İngilizce-I'),
        cls(4, '13:00', '15:00', 'Gıda Hijyeni ve Sanitasyonu'),
        cls(4, '15:00', '17:00', 'Gıda Biyoteknolojisi'),
        cls(5, '08:00', '10:00', 'Araştırma Yöntem ve Teknikleri'),
        cls(5, '10:00', '12:00', 'Gıda Kodeksi ve Standartları'),
        cls(5, '14:00', '16:00', 'Süt ve Ürünleri Teknolojisi'),
      ],
    },
  ],
  activities: [
    { id: 'kb1', name: 'Kickbox', day: 1, leave: '19:30', start: '20:30', end: '23:00', back: '24:00', rest: 0 },
    { id: 'kb3', name: 'Kickbox', day: 3, leave: '19:30', start: '20:30', end: '23:00', back: '24:00', rest: 0 },
    { id: 'kb5', name: 'Kickbox', day: 5, leave: '19:30', start: '20:30', end: '23:00', back: '24:00', rest: 0 },
    { id: 'fit2', name: 'Fitness', day: 2, leave: '10:30', start: '11:00', end: '12:00', back: '12:30', rest: 60 },
    { id: 'yuz6', name: 'Yüzme', day: 6, leave: '10:00', start: '11:00', end: '12:00', back: '12:30', rest: 60 },
  ],
  periods: [], // {id, type: 'sinav'|'tatil', label, start, end}
};

export const DEFAULT_STATE = {
  v: 1,
  settings: DEFAULT_SETTINGS,
  done: {}, // taskId -> timestamp
  skipped: {}, // taskId -> true (kaydırılanlardan atlananlar)
  topics: {}, // topicId -> {status: 0|1|2, weak: bool}
  exams: [], // {id, date, say, soz}
  frozen: {}, // tarih -> o günün sabitlenmiş programı (geçmiş ya da işaretlenmiş günler)
};
