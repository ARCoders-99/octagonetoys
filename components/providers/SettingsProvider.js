"use client";

import { createContext, useContext } from "react";
import { DEFAULT_STORE_SETTINGS } from "@/lib/constants";

const SettingsContext = createContext(DEFAULT_STORE_SETTINGS);

/** Provide the store settings loaded on the server to client components. */
export default function SettingsProvider({ settings, children }) {
  return (
    <SettingsContext.Provider value={{ ...DEFAULT_STORE_SETTINGS, ...(settings || {}) }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
