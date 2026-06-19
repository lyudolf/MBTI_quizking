// 앱 스크린샷 자동 캡처 (세로 636x1048) — 데이터 시드 후 각 화면 캡처
import puppeteer from 'puppeteer';
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const OUT = 'public/shots';

const cat = (t, c) => ({ totalAnswered: t, correctAnswered: c, answeredIds: [] });
const state = {
  userId: 'demo-1',
  nickname: '퀴즈왕민지',
  mbtiType: 'ENTP',
  totalXP: 16800,
  rank: 'diamond',
  equippedTitle: null,
  unlockedTitles: [],
  tickets: 3,
  dailyFreeTicketsUsed: 0,
  dailyAdTicketsUsed: 0,
  categoryProgress: {
    general: cat(142, 118), science: cat(96, 71), history: cat(88, 69), culture: cat(110, 90),
    economy: cat(64, 48), life: cat(120, 101), tech: cat(78, 60), art: cat(52, 40),
  },
  wrongNotes: [
    { questionId: 'science-1', category: 'science', wrongDate: '2026-06-12' },
    { questionId: 'history-3', category: 'history', wrongDate: '2026-06-13' },
    { questionId: 'economy-2', category: 'economy', wrongDate: '2026-06-14' },
  ],
  dailyChallengeCompleted: false,
  lastPlayDate: '2026-06-19',
  currentStreak: 7,
  longestStreak: 14,
};
const persisted = JSON.stringify({ state, version: 0 });

const shots = [
  { name: 'home', path: '/#/home', wait: 1600 },
  { name: 'quiz', path: '/#/quiz?category=general', wait: 2400 },
  { name: 'ranking', path: '/#/ranking', wait: 2600 },
  { name: 'category', path: '/#/category', wait: 1600 },
  { name: 'profile', path: '/#/profile', wait: 1600 },
];

mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
for (const s of shots) {
  const page = await browser.newPage();
  await page.setViewport({ width: 414, height: 682, deviceScaleFactor: 2 });
  await page.evaluateOnNewDocument((data) => {
    localStorage.setItem('quiz-master-storage', data);
  }, persisted);
  await page.goto(BASE + s.path, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise((r) => setTimeout(r, s.wait));
  const raw = await page.screenshot({ type: 'png' });
  await sharp(raw).resize(636, 1048).png().toFile(`${OUT}/${s.name}.png`);
  console.log('shot:', s.name);
  await page.close();
}
await browser.close();
console.log('done →', OUT);
