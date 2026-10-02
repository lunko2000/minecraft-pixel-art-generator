"use client";

import { useSyncExternalStore } from "react";
import type { Mode } from "@/app/pixel-art-provider";
import type { VersionFilter } from "@/data/blocks";

export type Preset = {
  id: string;
  name: string;
  mode: Mode;
  version: VersionFilter;
  excludedBlockIds: string[];
};

const STORAGE_KEY = "minecraft-pixel-art:presets";

function readStoredPresets(): Preset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Preset[]) : [];
  } catch {
    // Corrupt or unavailable storage (private browsing, etc.) just means no
    // presets, not a crash.
    return [];
  }
}

function writeStoredPresets(presets: Preset[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch {
    // Storage full or unavailable: the in-memory copy still works for this
    // session, it just won't survive a reload.
  }
}

// Presets live in localStorage, an external store React doesn't know about,
// so this reads/writes through useSyncExternalStore rather than useState +
// an effect: that avoids a mismatch against the server-rendered page (which
// has no access to localStorage at all) and the extra render an effect-based
// load would cause. `cache` holds the one copy every component sees; it's
// filled in lazily, since localStorage can only be read once on the client.
let cache: Preset[] | null = null;
const listeners = new Set<() => void>();

function getSnapshot(): Preset[] {
  cache ??= readStoredPresets();
  return cache;
}

// Must return the same reference every time, or React sees a "new" value on
// every check and treats it as a hydration mismatch on every render — an
// infinite-loop warning. (This exact bug showed up in use-collected-blocks,
// which started out with the same `=> new Set()` pattern.)
const EMPTY: Preset[] = [];
const getServerSnapshot = (): Preset[] => EMPTY;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function commit(next: Preset[]) {
  cache = next;
  writeStoredPresets(next);
  listeners.forEach((listener) => listener());
}

export function usePresets() {
  const presets = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const savePreset = (preset: Omit<Preset, "id">) => {
    commit([...getSnapshot(), { ...preset, id: crypto.randomUUID() }]);
  };

  const deletePreset = (id: string) => {
    commit(getSnapshot().filter((p) => p.id !== id));
  };

  return { presets, savePreset, deletePreset };
}
