/*
 * captcha.js — ThinkPHP-style CAPTCHA generator (100% client-side).
 *
 * Original website ka captcha /public/admin/Login/captcha.html server se
 * PNG bana kar bhejta tha. Yahan hum bilkul usi style ka SVG khud banate hain:
 *   - 250x62 canvas, light blue-white background (#f3fbfe)
 *   - 5 bade dark-color code characters, thora rotate/skew
 *   - pastel noise letters (kuch ulte flip hue) scattered
 *   - ek dark wavy curve jo image ko cross karti hai
 */

// Captcha ke liye allowed characters (confusing chars jaise 0,O,1,l hataye)
const CODE_SET = '2345678abcdefhkmnprwxyABCDEFGHKMNPRWXY';

// Noise letters ke pastel colors (original captcha sample se mile)
const NOISE_COLORS = [
  '#c8b4e0', '#96c7af', '#d4b6c5', '#ddaec6', '#aad3c5',
  '#b9a4c1', '#9c96ca', '#dfa1a8', '#caa1bd', '#a0d6a4',
];

// Main code characters ke dark colors (single color per captcha, original jaisa)
const MAIN_COLORS = ['#12117f', '#2f2f2f', '#7c1f1f', '#1a4a2a'];

// min..max ke beech random float
function rand(min, max) {
  return min + Math.random() * (max - min);
}

// min..max ke beech random integer
function randInt(min, max) {
  return Math.floor(rand(min, max + 1));
}

// array se random item
function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}

// SVG/XML special characters escape
function esc(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Random code generate karo (default 5 characters)
export function randomCode(len = 5) {
  let out = '';
  for (let i = 0; i < len; i++) out += CODE_SET[randInt(0, CODE_SET.length - 1)];
  return out;
}

// Poora SVG string banao — code characters + noise + wavy line
export function generateCaptchaSvg(code) {
  const W = 250;
  const H = 62;
  const parts = [];

  // 1) Noise letters — 46-60 chhote pastel harf random jagah par
  const noiseCount = randInt(46, 60);
  for (let i = 0; i < noiseCount; i++) {
    const ch = CODE_SET[randInt(0, CODE_SET.length - 1)];
    const x = rand(2, W - 8);
    const y = rand(12, H - 4);
    const fs = rand(9, 15); // font-size
    // adhe seedhe rotate, adhe 180° flip (original jaisa)
    const rot = Math.random() < 0.5 ? rand(-40, 40) : 180 + rand(-25, 25);
    const color = pick(NOISE_COLORS);
    const op = rand(0.45, 0.9).toFixed(2);
    parts.push(
      `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${fs.toFixed(1)}" fill="${color}" opacity="${op}" transform="rotate(${rot.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})" font-family="Arial, Helvetica, sans-serif">${esc(ch)}</text>`
    );
  }

  // 2) Wavy curve — beech se guzarti hui dark lehar
  const y0 = rand(H * 0.35, H * 0.65);
  const c1x = rand(W * 0.2, W * 0.4);
  const c1y = rand(-H * 0.4, H * 0.25);
  const c2x = rand(W * 0.6, W * 0.85);
  const c2y = rand(H * 0.75, H * 1.45);
  parts.push(
    `<path d="M -6 ${y0.toFixed(1)} C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${W + 6} ${rand(H * 0.3, H * 0.7).toFixed(1)}" stroke="${pick(MAIN_COLORS)}" stroke-width="1.6" fill="none" opacity="0.9"/>`
  );

  // 3) Main code characters — bade, dark, rotate + skew
  const n = code.length;
  const slot = W / n; // har character ka horizontal slot
  const mainColor = pick(MAIN_COLORS);
  for (let i = 0; i < n; i++) {
    const ch = code[i];
    const x = slot * i + slot / 2 + rand(-8, 8);
    const y = H / 2 + rand(6, 12);
    const fs = rand(30, 38);
    const rot = rand(-18, 18);
    const skew = rand(-4, 4).toFixed(1);
    parts.push(
      `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${fs.toFixed(1)}" font-weight="600" fill="${mainColor}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" transform="rotate(${rot.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}) skewX(${skew})">${esc(ch)}</text>`
    );
  }

  // Final SVG — background #f3fbfe + white overlay (original ka soft look)
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
    `<rect width="${W}" height="${H}" fill="#f3fbfe"/>` +
    `<rect width="${W}" height="${H}" fill="#ffffff" opacity="0.35"/>` +
    parts.join('') +
    `</svg>`
  );
}

// Nayi captcha banao: { code, dataUrl } — dataUrl seedha <img src> mein lagta hai
export function makeCaptcha() {
  const code = randomCode(5);
  const svg = generateCaptchaSvg(code);
  const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  return { code, dataUrl };
}
