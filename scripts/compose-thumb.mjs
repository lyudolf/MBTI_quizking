// 썸네일 마무리: thumb-raw → 1932x828 + 유형코드(머리 위) + (옵션)제목
import sharp from 'sharp';

const W = 1932, H = 828;
const SRC = 'public/thumb-raw.jfif';
const meta = await sharp(SRC).metadata();
const sw = meta.width, sh = meta.height; // 1376x768

// 원본 내 머리(왕관) 위치 추정 (좌/중/우), 원본 좌표 기준
const heads = {
  left: { x: 300, crownTop: 110, code: 'IxTx' },
  center: { x: 680, crownTop: 56, code: 'xNTx' },
  right: { x: 1050, crownTop: 116, code: 'xxTJ' },
};

const bg = await sharp(SRC).resize(W, H, { fit: 'cover' }).blur(26).toBuffer();

function codePill(cx, topY, text, fontSize = 34) {
  const w = 176, h = 50;
  return `
    <rect x="${cx - w / 2}" y="${topY}" width="${w}" height="${h}" rx="25" fill="#FFFFFF" fill-opacity="0.96"/>
    <text x="${cx}" y="${topY + h / 2 + fontSize * 0.36}" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="800" fill="#2563EB" text-anchor="middle" letter-spacing="3">${text}</text>`;
}

async function build({ withTitle, out }) {
  const artH = withTitle ? 712 : H;          // 제목 있으면 하단 띠 공간 확보
  const artW = Math.round((artH / sh) * sw);
  const offX = Math.round((W - artW) / 2);
  const offY = 0;
  const scale = artW / sw;

  const art = await sharp(SRC).resize(artW, artH).toBuffer();

  const px = (h) => Math.round(offX + h.x * scale);
  const crownY = (h) => Math.round(offY + h.crownTop * scale);

  const pills =
    codePill(px(heads.center), Math.max(2, crownY(heads.center) - 52), heads.center.code) +
    codePill(px(heads.left), Math.max(2, crownY(heads.left) - 52), heads.left.code, 32) +
    codePill(px(heads.right), Math.max(2, crownY(heads.right) - 52), heads.right.code, 32);

  const titleSvg = withTitle
    ? `<defs><linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
         <stop offset="0" stop-color="#1A47A0" stop-opacity="0"/>
         <stop offset="0.55" stop-color="#1A47A0" stop-opacity="0.92"/>
         <stop offset="1" stop-color="#143A8C" stop-opacity="0.98"/>
       </linearGradient></defs>
       <rect x="0" y="600" width="${W}" height="${H - 600}" fill="url(#scrim)"/>
       <text x="${W / 2}" y="792" font-family="Malgun Gothic, Apple SD Gothic Neo, sans-serif" font-size="62" font-weight="800" fill="#FFFFFF" text-anchor="middle">성격유형 퀴즈왕</text>`
    : '';

  const overlay = Buffer.from(
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${titleSvg}${pills}</svg>`
  );

  await sharp(bg)
    .composite([
      { input: art, left: offX, top: offY },
      { input: overlay, left: 0, top: 0 },
    ])
    .png()
    .toFile(out);
  console.log('done →', out);
}

await build({ withTitle: true, out: 'public/shots/thumbnail-title.png' });
await build({ withTitle: false, out: 'public/shots/thumbnail-clean.png' });
