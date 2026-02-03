const STORAGE_KEY_VIEWED = "gw2fashion_viewed";
const STORAGE_KEY_COPIED = "gw2fashion_copied";
const MAX_IDS = 500;

function getIds(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function addId(key: string, id: string): void {
  if (typeof window === "undefined") return;
  try {
    const ids = getIds(key);
    if (ids.includes(id)) return;
    const next = [...ids, id].slice(-MAX_IDS);
    window.localStorage.setItem(key, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function getViewedIds(): string[] {
  return getIds(STORAGE_KEY_VIEWED);
}

export function addViewedId(id: string): void {
  addId(STORAGE_KEY_VIEWED, id);
}

export function getCopiedIds(): string[] {
  return getIds(STORAGE_KEY_COPIED);
}

export function addCopiedId(id: string): void {
  addId(STORAGE_KEY_COPIED, id);
}
