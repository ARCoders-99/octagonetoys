// scripts/generate-demo-images.js
// Generates the eight demo product/collection illustrations used by the seed
// script. Flat vector art keeps the demo catalogue visually consistent and
// avoids licensing or hot-linking issues. Replace via the admin uploader with
// real product photography for a live store.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "../public/demo");
const SIZE = 900;

function frame(background, decorative) {
  return `
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${background[0]}"/>
        <stop offset="1" stop-color="${background[1]}"/>
      </linearGradient>
    </defs>
    <rect width="${SIZE}" height="${SIZE}" fill="url(#bg)"/>
    <circle cx="140" cy="150" r="82" fill="#ffffff" opacity="0.22"/>
    <circle cx="770" cy="120" r="52" fill="#ffffff" opacity="0.18"/>
    <circle cx="800" cy="700" r="110" fill="#ffffff" opacity="0.14"/>
    <circle cx="120" cy="720" r="64" fill="#ffffff" opacity="0.16"/>
    ${decorative || ""}
    <ellipse cx="450" cy="742" rx="292" ry="44" fill="#1e293b" opacity="0.12"/>
  `;
}

const stars = `
  <g fill="#ffffff" opacity="0.75">
    <path d="M690 250l8 20 21 3-15 15 4 21-18-11-18 11 4-21-15-15 21-3z"/>
    <path d="M205 330l6 15 16 2-12 11 3 16-13-8-14 8 3-16-11-11 16-2z"/>
    <path d="M740 470l5 12 13 2-10 9 2 13-10-7-11 7 2-13-9-9 13-2z"/>
  </g>
`;

const illustrations = {
  blocks: () => `
    ${frame(["#ffe8b8", "#ffc46b"], stars)}
    <g stroke="#1e293b" stroke-opacity="0.12" stroke-width="6">
      <rect x="242" y="470" width="190" height="190" rx="26" fill="#ff6b6b"/>
      <rect x="452" y="470" width="190" height="190" rx="26" fill="#4dabf7"/>
      <rect x="345" y="268" width="190" height="190" rx="26" fill="#ffd43b"/>
      <rect x="556" y="590" width="130" height="130" rx="22" fill="#51cf66"/>
    </g>
    <rect x="242" y="620" width="190" height="40" rx="20" fill="#e03131" opacity="0.55"/>
    <rect x="452" y="620" width="190" height="40" rx="20" fill="#1c7ed6" opacity="0.55"/>
    <rect x="345" y="418" width="190" height="40" rx="20" fill="#f59f00" opacity="0.55"/>
    <g fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="92" font-weight="800" text-anchor="middle">
      <text x="337" y="594">A</text>
      <text x="547" y="594">B</text>
      <text x="440" y="392">C</text>
    </g>
    <path d="M690 620l84 84h-84z" fill="#a855f7" opacity="0.9"/>
    <circle cx="760" cy="560" r="34" fill="#ec4899"/>
  `,

  "rc-car": () => `
    ${frame(["#dbeafe", "#93c5fd"], stars)}
    <g stroke="#1e293b" stroke-opacity="0.14" stroke-width="6">
      <rect x="170" y="452" width="560" height="160" rx="64" fill="#ff6b6b"/>
      <path d="M310 452c14-78 56-118 140-118s126 40 140 118z" fill="#4dabf7"/>
      <path d="M345 438c10-52 40-78 105-78s95 26 105 78z" fill="#bfdbfe"/>
      <rect x="146" y="500" width="70" height="52" rx="22" fill="#e03131"/>
      <rect x="692" y="440" width="56" height="26" rx="13" fill="#1e293b"/>
    </g>
    <circle cx="300" cy="620" r="82" fill="#1e293b"/>
    <circle cx="300" cy="620" r="40" fill="#cbd5e1"/>
    <circle cx="640" cy="620" r="82" fill="#1e293b"/>
    <circle cx="640" cy="620" r="40" fill="#cbd5e1"/>
    <path d="M726 448V300" stroke="#1e293b" stroke-width="10" stroke-linecap="round"/>
    <circle cx="726" cy="286" r="20" fill="#ffd43b"/>
    <g stroke="#ffffff" stroke-width="14" stroke-linecap="round" opacity="0.8">
      <path d="M96 540h70"/>
      <path d="M70 590h54"/>
      <path d="M110 640h46"/>
    </g>
    <circle cx="748" cy="620" r="26" fill="#ffd43b"/>
  `,

  "plush-bear": () => `
    ${frame(["#ffe4f1", "#f9a8d4"], stars)}
    <ellipse cx="330" cy="270" rx="66" ry="66" fill="#b07a4f"/>
    <ellipse cx="330" cy="270" rx="34" ry="34" fill="#f3d9b1"/>
    <ellipse cx="570" cy="270" rx="66" ry="66" fill="#b07a4f"/>
    <ellipse cx="570" cy="270" rx="34" ry="34" fill="#f3d9b1"/>
    <ellipse cx="450" cy="590" rx="196" ry="200" fill="#c08a5c"/>
    <ellipse cx="450" cy="620" rx="120" ry="132" fill="#e8c39e"/>
    <circle cx="450" cy="352" r="158" fill="#c08a5c"/>
    <ellipse cx="450" cy="402" rx="94" ry="72" fill="#f3d9b1"/>
    <circle cx="392" cy="322" r="19" fill="#3b2416"/>
    <circle cx="508" cy="322" r="19" fill="#3b2416"/>
    <circle cx="398" cy="315" r="6" fill="#ffffff"/>
    <circle cx="514" cy="315" r="6" fill="#ffffff"/>
    <ellipse cx="450" cy="386" rx="30" ry="22" fill="#3b2416"/>
    <path d="M450 408v18M450 426c-12 18-34 20-44 4M450 426c12 18 34 20 44 4" fill="none" stroke="#3b2416" stroke-width="9" stroke-linecap="round"/>
    <path d="M340 512c-56 20-82 62-62 92s62 16 92-14z" fill="#b07a4f"/>
    <path d="M560 512c56 20 82 62 62 92s-62 16-92-14z" fill="#b07a4f"/>
    <path d="M380 512l70 48 70-48-20 78-50 24-50-24z" fill="#ec4899"/>
    <circle cx="450" cy="560" r="20" fill="#be185d"/>
    <ellipse cx="372" cy="742" rx="60" ry="34" fill="#b07a4f"/>
    <ellipse cx="528" cy="742" rx="60" ry="34" fill="#b07a4f"/>
    <ellipse cx="450" cy="650" rx="58" ry="52" fill="#f472b6"/>
    <path d="M450 622c-14 18-14 40 0 56 14-16 14-38 0-56z" fill="#ffffff" opacity="0.85"/>
  `,

  puzzle: () => `
    ${frame(["#dcfce7", "#86efac"], stars)}
    <g stroke="#1e293b" stroke-opacity="0.14" stroke-width="5" stroke-linejoin="round">
      <g transform="translate(236 216) rotate(-5 110 110)">
        <path d="M0 0H220V72a30 30 0 1 1 0 60V220H140a30 30 0 1 0-60 0H0Z" fill="#ffd43b"/>
      </g>
      <g transform="translate(468 228) rotate(6 110 110)">
        <path d="M0 0H220V72a30 30 0 1 1 0 60V220H140a30 30 0 1 0-60 0H0Z" fill="#4dabf7"/>
      </g>
      <g transform="translate(244 462) rotate(4 110 110)">
        <path d="M0 0H220V72a30 30 0 1 1 0 60V220H140a30 30 0 1 0-60 0H0Z" fill="#f472b6"/>
      </g>
      <g transform="translate(474 470) rotate(-6 110 110)">
        <path d="M0 0H220V72a30 30 0 1 1 0 60V220H140a30 30 0 1 0-60 0H0Z" fill="#51cf66"/>
      </g>
    </g>
    <circle cx="745" cy="212" r="30" fill="#a855f7" opacity="0.75"/>
    <circle cx="788" cy="300" r="16" fill="#ffffff" opacity="0.85"/>
    <circle cx="158" cy="252" r="22" fill="#ffffff" opacity="0.8"/>
    <path d="M168 700l34 18-34 18z" fill="#f59e0b" opacity="0.9"/>
  `,

  rocket: () => `
    ${frame(["#e9d5ff", "#a78bfa"], stars)}
    <circle cx="728" cy="252" r="74" fill="#fbbf24" opacity="0.9"/>
    <ellipse cx="728" cy="252" rx="112" ry="26" fill="#ffffff" opacity="0.7" transform="rotate(-18 728 252)"/>
    <path d="M450 170c72 70 108 168 108 286v98H342v-98c0-118 36-216 108-286z" fill="#f8fafc" stroke="#1e293b" stroke-opacity="0.1" stroke-width="6"/>
    <path d="M450 150c44 56 74 120 86 196H364c12-76 42-140 86-196z" fill="#ff6b6b"/>
    <circle cx="450" cy="404" r="62" fill="#4dabf7" stroke="#e2e8f0" stroke-width="14"/>
    <path d="M342 470c-56 34-78 82-74 138 44-8 76-30 100-64z" fill="#ff6b6b"/>
    <path d="M558 470c56 34 78 82 74 138-44-8-76-30-100-64z" fill="#ff6b6b"/>
    <path d="M450 554c40 42 52 90 0 150-52-60-40-108 0-150z" fill="#ffa94d"/>
    <path d="M450 590c22 24 28 52 0 86-28-34-22-62 0-86z" fill="#ffd43b"/>
    <circle cx="245" cy="470" r="10" fill="#ffffff"/>
    <circle cx="660" cy="560" r="8" fill="#ffffff"/>
    <circle cx="240" cy="620" r="6" fill="#ffffff"/>
    <path d="M622 610l10 24 25 3-18 17 5 25-22-13-22 13 5-25-18-17 25-3z" fill="#ffffff" opacity="0.85"/>
  `,

  "science-kit": () => `
    ${frame(["#ccfbf1", "#5eead4"], stars)}
    <path d="M398 258h104v132l136 232c22 38-4 86-48 86H310c-44 0-70-48-48-86l136-232z" fill="#e2e8f0" stroke="#1e293b" stroke-opacity="0.12" stroke-width="6"/>
    <path d="M368 512l-78 132c-14 24 2 52 30 52h260c28 0 44-28 30-52l-78-132z" fill="#34d399"/>
    <path d="M386 246h128v26H386z" fill="#94a3b8"/>
    <circle cx="410" cy="590" r="18" fill="#a7f3d0" opacity="0.9"/>
    <circle cx="500" cy="628" r="13" fill="#a7f3d0" opacity="0.9"/>
    <circle cx="462" cy="650" r="9" fill="#a7f3d0" opacity="0.9"/>
    <g transform="rotate(24 640 400)">
      <rect x="614" y="300" width="52" height="210" rx="26" fill="#bfdbfe" stroke="#1e293b" stroke-opacity="0.12" stroke-width="5"/>
      <rect x="614" y="400" width="52" height="110" rx="26" fill="#60a5fa"/>
    </g>
    <g fill="none" stroke="#0f766e" stroke-width="10" opacity="0.6">
      <circle cx="214" cy="300" r="34"/>
      <circle cx="262" cy="244" r="16"/>
    </g>
    <circle cx="720" cy="230" r="26" fill="#ffffff" opacity="0.9"/>
    <circle cx="760" cy="300" r="12" fill="#ffffff" opacity="0.8"/>
    <path d="M214 600l8 20 21 3-15 15 4 21-18-11-18 11 4-21-15-15 21-3z" fill="#ffffff"/>
  `,

  "art-set": () => `
    ${frame(["#fce7f3", "#f9a8d4"], stars)}
    <path d="M450 250c-146 0-256 100-256 226 0 96 74 154 160 154h38c34 0 40 40 22 62-18 24 4 58 38 58 118 0 254-96 254-250 0-140-116-250-256-250z" fill="#fef3c7" stroke="#1e293b" stroke-opacity="0.12" stroke-width="6"/>
    <circle cx="338" cy="390" r="38" fill="#ff6b6b"/>
    <circle cx="450" cy="338" r="38" fill="#4dabf7"/>
    <circle cx="562" cy="390" r="38" fill="#ffd43b"/>
    <circle cx="596" cy="508" r="38" fill="#51cf66"/>
    <circle cx="318" cy="520" r="38" fill="#a855f7"/>
    <circle cx="392" cy="604" r="58" fill="#ffffff"/>
    <g transform="rotate(38 640 560)">
      <rect x="606" y="330" width="40" height="230" rx="20" fill="#f59e0b"/>
      <rect x="602" y="540" width="48" height="64" rx="12" fill="#cbd5e1"/>
      <path d="M602 604h48l-10 80c-2 14-26 14-28 0z" fill="#fb923c"/>
    </g>
    <g transform="rotate(-24 250 640)">
      <rect x="222" y="560" width="32" height="196" rx="16" fill="#a855f7"/>
      <path d="M222 756h32l-16 42z" fill="#f3d9b1"/>
    </g>
    <circle cx="690" cy="270" r="20" fill="#ffffff" opacity="0.8"/>
    <circle cx="742" cy="336" r="12" fill="#ffffff" opacity="0.8"/>
  `,

  dollhouse: () => `
    ${frame(["#ffedd5", "#fdba74"], stars)}
    <ellipse cx="450" cy="742" rx="310" ry="40" fill="#51cf66" opacity="0.45"/>
    <rect x="286" y="392" width="328" height="300" rx="14" fill="#fff7ed" stroke="#1e293b" stroke-opacity="0.12" stroke-width="6"/>
    <path d="M244 400l206-166 206 166z" fill="#ec4899"/>
    <path d="M276 388l174-140 174 140z" fill="#f472b6"/>
    <rect x="556" y="272" width="42" height="96" rx="8" fill="#a855f7"/>
    <rect x="404" y="556" width="92" height="136" rx="12" fill="#f59e0b"/>
    <circle cx="480" cy="626" r="8" fill="#78350f"/>
    <rect x="320" y="452" width="92" height="92" rx="10" fill="#93c5fd" stroke="#dbeafe" stroke-width="10"/>
    <path d="M366 452v92M320 498h92" stroke="#ffffff" stroke-width="8"/>
    <rect x="488" y="452" width="92" height="92" rx="10" fill="#93c5fd" stroke="#dbeafe" stroke-width="10"/>
    <path d="M534 452v92M488 498h92" stroke="#ffffff" stroke-width="8"/>
    <g fill="#f472b6">
      <circle cx="214" cy="700" r="22"/>
      <circle cx="178" cy="720" r="16"/>
      <circle cx="682" cy="710" r="20"/>
      <circle cx="722" cy="726" r="14"/>
    </g>
    <g stroke="#22c55e" stroke-width="8" stroke-linecap="round">
      <path d="M214 722v34M178 742v22M682 732v26M722 742v18"/>
    </g>
    <ellipse cx="196" cy="220" rx="66" ry="30" fill="#ffffff" opacity="0.8"/>
    <ellipse cx="250" cy="230" rx="46" ry="24" fill="#ffffff" opacity="0.8"/>
    <ellipse cx="700" cy="190" rx="58" ry="26" fill="#ffffff" opacity="0.7"/>
  `,
};

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const [slug, draw] of Object.entries(illustrations)) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">${draw()}</svg>`;
    const file = path.join(OUT_DIR, `${slug}.jpg`);
    await sharp(Buffer.from(svg)).jpeg({ quality: 88, chromaSubsampling: "4:4:4" }).toFile(file);
    console.log(`wrote ${path.relative(process.cwd(), file)}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
