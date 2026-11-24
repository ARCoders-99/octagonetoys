// lib/server/settings.js
// Store-wide settings with safe defaults.
//
// `normalizeSettings` lives in `settingsRules.js` so it stays free of database
// imports; `getSettings` is the reader used by layouts, pages and APIs.

import { connect } from "@/lib/mongoose";
import Setting from "@/lib/models/Setting";
import { normalizeSettings } from "@/lib/server/settingsRules";

export { normalizeSettings };

/**
 * Read the singleton settings document. Falls back to defaults if the
 * database is unavailable so the storefront never crashes on boot.
 */
export async function getSettings() {
  try {
    await connect();
    const doc = await Setting.findOne({ key: "store" }).lean();
    return normalizeSettings(doc || {});
  } catch (error) {
    console.error("Could not load store settings:", error.message);
    return normalizeSettings({});
  }
}

/** Persist settings. Returns the normalized, saved values. */
export async function saveSettings(payload = {}, updatedBy = "") {
  await connect();

  const normalized = normalizeSettings(payload);
  const update = {
    ...normalized,
    key: "store",
    updatedBy: String(updatedBy || "").trim(),
  };

  const saved = await Setting.findOneAndUpdate(
    { key: "store" },
    { $set: update },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).lean();

  return normalizeSettings(saved);
}
