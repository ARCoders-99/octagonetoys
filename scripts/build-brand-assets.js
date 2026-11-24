// scripts/build-brand-assets.js
// Builds web-ready brand assets from the supplied logo artwork.
//
// Outputs:
//   public/brand/logo.png        transparent, tightly cropped wordmark + mascot
//   public/brand/logo-square.png square transparent mark for social/avatars
//   app/icon.png                 512x512 favicon/app icon
//
// Usage: node scripts/build-brand-assets.js

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

const ROOT = process.cwd();
const SOURCE = path.join(ROOT, "assets", "brand", "logo-white-bg.jpg");
const SOURCE_SQUARE = path.join(ROOT, "assets", "brand", "logo-black-bg.jpg");
const OUT_DIR = path.join(ROOT, "public", "brand");

// Anything lighter than this in every channel counts as removable background.
const BACKGROUND_MIN = 232;

async function removeWhiteBackground(inputPath) {
  const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const channels = 4;

  const isBackground = (x, y) => {
    const index = (y * width + x) * channels;
    return data[index] >= BACKGROUND_MIN && data[index + 1] >= BACKGROUND_MIN && data[index + 2] >= BACKGROUND_MIN;
  };

  // Flood fill from the outer edge only, so white details inside the rocket
  // stay opaque instead of turning into holes.
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;

  const enqueue = (x, y) => {
    const pixel = y * width + x;
    if (visited[pixel]) return;
    visited[pixel] = 1;
    if (!isBackground(x, y)) return;
    queue[tail++] = pixel;
  };

  for (let x = 0; x < width; x += 1) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }

  while (head < tail) {
    const pixel = queue[head++];
    const px = pixel % width;
    const py = (pixel - px) / width;
    data[pixel * channels + 3] = 0;

    if (px > 0) enqueue(px - 1, py);
    if (px < width - 1) enqueue(px + 1, py);
    if (py > 0) enqueue(px, py - 1);
    if (py < height - 1) enqueue(px, py + 1);
  }

  // Semi-transparent halo cleanup: soften near-white pixels left on the edge.
  for (let pixel = 0; pixel < width * height; pixel += 1) {
    const index = pixel * channels;
    if (data[index + 3] === 0) continue;
    const lightest = Math.min(data[index], data[index + 1], data[index + 2]);
    if (lightest > 246) data[index + 3] = 255;
  }

  return { data, width, height };
}

function alphaBounds(data, width, height) {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { minX, minY, maxX, maxY };
}

// Packs PNG buffers into a Windows .ico container. Modern browsers accept
// PNG-compressed icon entries, so no BMP encoding is needed.
function buildIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  const entries = Buffer.alloc(16 * images.length);
  let offset = 6 + 16 * images.length;

  images.forEach((image, index) => {
    const entry = 16 * index;
    entries.writeUInt8(image.width >= 256 ? 0 : image.width, entry);
    entries.writeUInt8(image.height >= 256 ? 0 : image.height, entry + 1);
    entries.writeUInt8(0, entry + 2);
    entries.writeUInt8(0, entry + 3);
    entries.writeUInt16LE(1, entry + 4);
    entries.writeUInt16LE(32, entry + 6);
    entries.writeUInt32LE(image.data.length, entry + 8);
    entries.writeUInt32LE(offset, entry + 12);
    offset += image.data.length;
  });

  return Buffer.concat([header, entries, ...images.map((image) => image.data)]);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const { data, width, height } = await removeWhiteBackground(SOURCE);
  const bounds = alphaBounds(data, width, height);
  const padding = 10;

  const left = Math.max(0, bounds.minX - padding);
  const top = Math.max(0, bounds.minY - padding);
  const right = Math.min(width, bounds.maxX + 1 + padding);
  const bottom = Math.min(height, bounds.maxY + 1 + padding);
  const cropWidth = right - left;
  const cropHeight = bottom - top;

  const transparent = sharp(data, { raw: { width, height, channels: 4 } });

  const logo = await transparent
    .clone()
    .extract({ left, top, width: cropWidth, height: cropHeight })
    .resize({ width: Math.min(cropWidth, 640), withoutEnlargement: true })
    .png({ compressionLevel: 9, palette: true, quality: 92 })
    .toFile(path.join(OUT_DIR, "logo.png"));

  // Square version for avatars / social cards: pad the lockup on a transparent canvas.
  await sharp(path.join(OUT_DIR, "logo.png"))
    .resize(512, 512, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png({ compressionLevel: 9, palette: true, quality: 92 })
    .toFile(path.join(OUT_DIR, "logo-square.png"));

  // Favicon/app icon from the square black artwork, sized for browser tabs.
  await sharp(SOURCE_SQUARE)
    .resize(512, 512, { fit: "cover" })
    .png({ compressionLevel: 9 })
    .toFile(path.join(ROOT, "app", "icon.png"));

  // Multi-size .ico for browsers that request /favicon.ico directly.
  const iconSizes = [16, 32, 48, 64, 128, 256];
  const iconPngs = await Promise.all(
    iconSizes.map(async (size) => ({
      width: size,
      height: size,
      data: await sharp(SOURCE_SQUARE)
        .resize(size, size, { fit: "cover" })
        .png({ compressionLevel: 9 })
        .toBuffer(),
    }))
  );
  await writeFile(path.join(ROOT, "public", "favicon.ico"), buildIco(iconPngs));

  console.log("Brand assets written:");
  console.log(`  public/brand/logo.png        ${logo.width}x${logo.height}`);
  console.log(`  public/brand/logo-square.png 512x512 (padded)`);
  console.log("  app/icon.png                 512x512");
  console.log("  public/favicon.ico           " + iconSizes.join(", ") + " px");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
