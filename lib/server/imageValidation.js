// lib/server/imageValidation.js
// Magic-byte sniffing for uploads. A browser-supplied MIME type is only a hint,
// so the real file signature decides whether we accept an image.

export const ALLOWED_IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

function ascii(buffer, start, end) {
  return buffer.subarray(start, end).toString("ascii");
}

/**
 * Return the detected image MIME type, or null when the bytes are not one of
 * the accepted formats.
 */
export function detectImageType(buffer) {
  if (!buffer || typeof buffer.length !== "number" || buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  // WebP: "RIFF" <size> "WEBP"
  if (ascii(buffer, 0, 4) === "RIFF" && ascii(buffer, 8, 12) === "WEBP") {
    return "image/webp";
  }

  // AVIF / AVIS: ISO-BMFF box "ftyp" followed by the brand.
  if (ascii(buffer, 4, 8) === "ftyp") {
    const brand = ascii(buffer, 8, 12);
    if (brand === "avif" || brand === "avis") return "image/avif";
  }

  return null;
}

/** File extension that matches the detected type. */
export function extensionForType(mimeType) {
  return ALLOWED_IMAGE_TYPES[mimeType] || "";
}
