// 가로형 피처 그래픽(1504x741): 세로 스크린샷 3컷을 토스블루 배경에 합성
import sharp from 'sharp';

const W = 1504, H = 741;
const OUT = 'public/shots/landscape.png';

const bgSvg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#3A8BFF"/><stop offset="1" stop-color="#2766D6"/>
  </linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <text x="752" y="96" font-family="Malgun Gothic, Apple SD Gothic Neo, sans-serif" font-size="66" font-weight="800" fill="#FFFFFF" text-anchor="middle">성격유형 퀴즈왕</text>
  <text x="752" y="148" font-family="Malgun Gothic, Apple SD Gothic Neo, sans-serif" font-size="30" font-weight="600" fill="#DCEBFF" text-anchor="middle">같은 성격유형끼리 겨루는 상식 퀴즈 배틀</text>
</svg>`;

const base = sharp(Buffer.from(bgSvg)).png();

const innerW = 328, innerH = 540, border = 6;
async function frame(file) {
  return sharp(file)
    .resize(innerW, innerH)
    .extend({ top: border, bottom: border, left: border, right: border, background: '#FFFFFF' })
    .png()
    .toBuffer();
}

const [home, quiz, ranking] = await Promise.all([
  frame('public/shots/home.png'),
  frame('public/shots/quiz.png'),
  frame('public/shots/ranking.png'),
]);

const fw = innerW + border * 2; // 340
const gap = 50;
const totalW = fw * 3 + gap * 2;
const x0 = Math.round((W - totalW) / 2);
const y = 168;

await base
  .composite([
    { input: home, left: x0, top: y },
    { input: quiz, left: x0 + (fw + gap), top: y },
    { input: ranking, left: x0 + (fw + gap) * 2, top: y },
  ])
  .resize(W, H)
  .png()
  .toFile(OUT);

console.log('done →', OUT);
