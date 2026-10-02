"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "minecraft-pixel-art:collected-blocks";

function readStored(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    // Corrupt or unavailable storage (private browsing, etc.) just means
    // nothing's marked collected yet, not a crash.
    return new Set();
  }
}

function writeStored(ids: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // Storage full or unavailable: the in-memory copy still works for this
    // session, it just won't survive a reload.
  }
}

// Which block types you've already gathered, kept in localStorage rather
// than tied to any one generated grid: collecting materials for a build can
// take multiple sittings, closing the browser in between, and your actual
// pile of blocks doesn't reset just because the page did. It's also not
// scoped to "this" pixel art — generate the same build again later (or a
// different one that happens to share some blocks) and whatever you'd
// already collected is still checked off.
let cache: Set<string> | null = null;
const listeners = new Set<() => void>();

function getSnapshot(): Set<string> {
  cache ??= readStored();
  return cache;
}

// Must return the same reference every time, or React sees a "new" value on
// every check and treats it as a hydration mismatch on every render — which
// is exactly the infinite-loop warning this was throwing.
const EMPTY: Set<string> = new Set();
const getServerSnapshot = (): Set<string> => EMPTY;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function commit(next: Set<string>) {
  cache = next;
  writeStored(next);
  listeners.forEach((listener) => listener());
}

export function useCollectedBlocks() {
  const collected = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleCollected = (id: string) => {
    const next = new Set(getSnapshot());
    if (!next.delete(id)) next.add(id);
    commit(next);
  };

  const clearCollected = () => commit(new Set());

  return { collected, toggleCollected, clearCollected };
}
