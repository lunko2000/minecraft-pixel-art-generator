"use client";

import { useSyncExternalStore } from "react";

export type Language = "en" | "ja" | "ja-furigana";
const DEFAULT_LANGUAGE: Language = "en";
const STORAGE_KEY = "minecraft-pixel-art:language";
const LANGUAGES: Language[] = ["en", "ja", "ja-furigana"];

function readStored(): Language {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return LANGUAGES.includes(raw as Language) ? (raw as Language) : DEFAULT_LANGUAGE;
  } catch {
    // Corrupt or unavailable storage (private browsing, etc.) just means the
    // default language, not a crash.
    return DEFAULT_LANGUAGE;
  }
}

function writeStored(language: Language) {
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Storage full or unavailable: the in-memory copy still works for this
    // session, it just won't survive a reload.
  }
}

// Same useSyncExternalStore pattern as the other localStorage-backed hooks
// (presets, collected blocks): avoids a server/client mismatch, since the
// server has no language preference to read, and avoids the extra render an
// effect-based load would cause.
let cache: Language | null = null;
const listeners = new Set<() => void>();

function getSnapshot(): Language {
  cache ??= readStored();
  return cache;
}

const getServerSnapshot = (): Language => DEFAULT_LANGUAGE;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function commit(next: Language) {
  cache = next;
  writeStored(next);
  listeners.forEach((listener) => listener());
}

export function useLanguage() {
  const language = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const setLanguage = (next: Language) => commit(next);
  return { language, setLanguage };
}
