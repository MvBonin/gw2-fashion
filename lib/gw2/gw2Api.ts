/**
 * GW2-API-Helper: Skins und Farben abfragen (ohne API-Key).
 * Basis-URL: https://api.guildwars2.com
 */

const GW2_API_BASE = "https://api.guildwars2.com";

/** RGB-Tupel von der API (base_rgb oder material.rgb). */
export type RgbTuple = [number, number, number];

/** Eine Farbe für die UI: Name, RGB und Hex-Code (aus GW2-API base_rgb). */
export type ResolvedColor = {
  name: string;
  rgb: RgbTuple;
  /** Hex-String z. B. #7A1A1A für CSS/Anzeige. */
  hex: string;
  /** GW2 Color-ID für Wiki/Chat-Link (optional). */
  id?: number;
};

/** Aufgelöster Eintrag für die UI (Skin + Farben pro Slot). */
export type SkinsAndColorsEntry = {
  slot: string;
  skinName: string;
  skinIcon?: string;
  /** Skin-ID für Wiki/Chat-Link (optional). */
  skinId?: number;
  colors: ResolvedColor[];
  /** false bei Waffen-Slots (keine Färbung im Spiel). */
  showColors?: boolean;
  /** Slot ist im Template ausgeblendet (z. B. Helm aus). */
  hidden?: boolean;
};

/** Konvertiert GW2-API RGB [0–255] in Hex #RRGGBB. */
export function rgbToHex(rgb: RgbTuple): string {
  return "#" + rgb.map((n) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0")).join("");
}

/** Liefert die Anzeige-RGB einer Farbe (Material-RGB, nicht base_rgb). base_rgb ist bei vielen Farben gleich [128,26,26]. */
export function getDisplayRgb(c: Gw2Color): RgbTuple {
  return c.cloth?.rgb ?? c.leather?.rgb ?? c.metal?.rgb ?? c.fur?.rgb ?? c.base_rgb;
}

const BATCH_SIZE = 200;

export interface Gw2Skin {
  id: number;
  name: string;
  type: string;
  icon?: string;
  details?: {
    type?: string;
    weight_class?: string;
    dye_slots?: { default?: Array<{ color_id: number; material: string } | null> };
  };
}

export interface Gw2Color {
  id: number;
  name: string;
  base_rgb: [number, number, number];
  cloth?: { rgb: [number, number, number] };
  leather?: { rgb: [number, number, number] };
  metal?: { rgb: [number, number, number] };
  fur?: { rgb: [number, number, number] };
}

/** Einfacher In-Memory-Cache (TTL 1h) für GW2-API-Antworten. */
const skinCache = new Map<string, { data: Gw2Skin[]; expires: number }>();
const colorCache = new Map<string, { data: Gw2Color[]; expires: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000;

function getCachedSkins(idsKey: string): Gw2Skin[] | null {
  const entry = skinCache.get(idsKey);
  if (!entry || Date.now() > entry.expires) return null;
  return entry.data;
}

function setCachedSkins(idsKey: string, data: Gw2Skin[]): void {
  skinCache.set(idsKey, { data, expires: Date.now() + CACHE_TTL_MS });
}

function getCachedColors(idsKey: string): Gw2Color[] | null {
  const entry = colorCache.get(idsKey);
  if (!entry || Date.now() > entry.expires) return null;
  return entry.data;
}

function setCachedColors(idsKey: string, data: Gw2Color[]): void {
  colorCache.set(idsKey, { data, expires: Date.now() + CACHE_TTL_MS });
}

/**
 * Ruft Skin-Details von der GW2-API ab (Batch, max. BATCH_SIZE IDs).
 * Kein API-Key nötig.
 */
export async function fetchSkins(ids: number[]): Promise<Gw2Skin[]> {
  const unique = [...new Set(ids)].filter((id) => id > 0);
  if (unique.length === 0) return [];

  const chunks: number[][] = [];
  for (let i = 0; i < unique.length; i += BATCH_SIZE) {
    chunks.push(unique.slice(i, i + BATCH_SIZE));
  }

  const results: Gw2Skin[] = [];
  for (const chunk of chunks) {
    const idsKey = chunk.join(",");
    const cached = getCachedSkins(idsKey);
    if (cached) {
      results.push(...cached);
      continue;
    }
    const url = `${GW2_API_BASE}/v2/skins?ids=${chunk.join(",")}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) continue;
    const data = (await res.json()) as Gw2Skin[];
    if (Array.isArray(data)) {
      setCachedSkins(idsKey, data);
      results.push(...data);
    }
  }
  return results;
}

/**
 * Ruft Farb-Details von der GW2-API ab (Batch, max. BATCH_SIZE IDs).
 * Kein API-Key nötig.
 */
export async function fetchColors(ids: number[]): Promise<Gw2Color[]> {
  const unique = [...new Set(ids)].filter((id) => id > 0);
  if (unique.length === 0) return [];

  const chunks: number[][] = [];
  for (let i = 0; i < unique.length; i += BATCH_SIZE) {
    chunks.push(unique.slice(i, i + BATCH_SIZE));
  }

  const results: Gw2Color[] = [];
  for (const chunk of chunks) {
    const idsKey = chunk.join(",");
    const cached = getCachedColors(idsKey);
    if (cached) {
      results.push(...cached);
      continue;
    }
    const url = `${GW2_API_BASE}/v2/colors?ids=${chunk.join(",")}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) continue;
    const data = (await res.json()) as Gw2Color[];
    if (Array.isArray(data)) {
      setCachedColors(idsKey, data);
      results.push(...data);
    }
  }
  return results;
}
