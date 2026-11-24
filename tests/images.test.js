// tests/images.test.js
// Magic-byte sniffing used before accepting an upload.

import test from "node:test";
import assert from "node:assert/strict";

import {
  ALLOWED_IMAGE_TYPES,
  detectImageType,
  extensionForType,
} from "../lib/server/imageValidation.js";

function pad(buffer, size = 32) {
  return Buffer.concat([buffer, Buffer.alloc(Math.max(0, size - buffer.length))]);
}

test("detectImageType recognises JPEG", () => {
  assert.equal(detectImageType(pad(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))), "image/jpeg");
});

test("detectImageType recognises PNG", () => {
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.equal(detectImageType(pad(png)), "image/png");
});

test("detectImageType recognises WebP", () => {
  const webp = Buffer.concat([
    Buffer.from("RIFF", "ascii"),
    Buffer.from([0x20, 0x00, 0x00, 0x00]),
    Buffer.from("WEBP", "ascii"),
  ]);
  assert.equal(detectImageType(pad(webp)), "image/webp");
});

test("detectImageType recognises AVIF", () => {
  const avif = Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00, 0x20]),
    Buffer.from("ftypavif", "ascii"),
  ]);
  assert.equal(detectImageType(pad(avif)), "image/avif");
});

test("detectImageType rejects non-images and short buffers", () => {
  assert.equal(detectImageType(Buffer.from("<svg xmlns=\"http://www.w3.org/2000/svg\"></svg>")), null);
  assert.equal(detectImageType(Buffer.from("GIF89a-----------", "ascii")), null);
  assert.equal(detectImageType(Buffer.from("hello world!", "ascii")), null);
  assert.equal(detectImageType(Buffer.from([0xff, 0xd8])), null);
  assert.equal(detectImageType(Buffer.alloc(0)), null);
  assert.equal(detectImageType(null), null);
});

test("extensionForType maps only whitelisted MIME types", () => {
  assert.equal(extensionForType("image/jpeg"), "jpg");
  assert.equal(extensionForType("image/png"), "png");
  assert.equal(extensionForType("image/webp"), "webp");
  assert.equal(extensionForType("image/avif"), "avif");
  assert.equal(extensionForType("image/svg+xml"), "");
  assert.equal(extensionForType("text/html"), "");
  assert.deepEqual(Object.keys(ALLOWED_IMAGE_TYPES).sort(), [
    "image/avif",
    "image/jpeg",
    "image/png",
    "image/webp",
  ]);
});
