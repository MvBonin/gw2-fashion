/**
 * GW2 Fashion-Template-Parser (Chat-Link Typ 0x0F).
 * Single Source of Truth: FASHION-PARSE.md – alle Offsets aus der Byte-Tabelle.
 */

const EQUIPMENT_TEMPLATE_TYPE = 0x0f;
const MIN_PAYLOAD_LENGTH = 97;

export interface FashionSlotEntry {
  slot: string;
  skinId: number;
  colorIds: (number | null)[];
}

/** Slots, die Waffen sind (keine Dye-Anzeige im Spiel). */
export const WEAPON_SLOTS = new Set([
  "WeaponSet1Main",
  "WeaponSet1Off",
  "WeaponSet2Main",
  "WeaponSet2Off",
  "WeaponAquaticA",
  "WeaponAquaticB",
]);

/** Slot-Definition: 1:1 aus FASHION-PARSE.md Byte-Tabelle. skinOffset = erstes Byte des 2B-LE. */
interface SlotSpec {
  slot: string;
  skinOffset: number;
  /** Start-Offsets der 4× 2B LE Dye-Werte (z. B. [5, 7, 9, 11] für Backpack). */
  dyeOffsets?: [number, number, number, number];
}

/** Reihenfolge und Offsets gemäß FASHION-PARSE.md. */
const SLOT_SPECS: readonly SlotSpec[] = [
  { slot: "Helm", skinOffset: 43, dyeOffsets: [45, 47, 49, 51] },
  { slot: "Shoulders", skinOffset: 63, dyeOffsets: [65, 67, 69, 71] },
  { slot: "Coat", skinOffset: 13, dyeOffsets: [15, 17, 19, 21] },
  { slot: "Gloves", skinOffset: 33, dyeOffsets: [35, 37, 39, 41] },
  { slot: "Leggings", skinOffset: 53, dyeOffsets: [55, 57, 59, 61] },
  { slot: "Boots", skinOffset: 23, dyeOffsets: [25, 27, 29, 31] },
  { slot: "Backpack", skinOffset: 3, dyeOffsets: [5, 7, 9, 11] },
  { slot: "Aquabreather", skinOffset: 1 },
  { slot: "Outfit", skinOffset: 73, dyeOffsets: [75, 77, 79, 81] },
  { slot: "WeaponSet1Main", skinOffset: 87 },
  { slot: "WeaponSet1Off", skinOffset: 89 },
  { slot: "WeaponSet2Main", skinOffset: 91 },
  { slot: "WeaponSet2Off", skinOffset: 93 },
  { slot: "WeaponAquaticA", skinOffset: 83 },
  { slot: "WeaponAquaticB", skinOffset: 85 },
];

function extractBase64(chatCode: string): string {
  const trimmed = chatCode.trim();
  const match = trimmed.match(/^\[\&(.+)\]\s*$/);
  if (!match) throw new Error("Invalid chat code format: expected [&...=]");
  return match[1];
}

function readU16Safe(payload: Buffer, offset: number): number | null {
  if (offset + 2 > payload.length) return null;
  return payload.readUInt16LE(offset);
}

/**
 * Dekodiert einen Fashion-Template-Code (Typ 0x0F) in Slots mit Skin- und Farb-IDs.
 * Liest strikt nach FASHION-PARSE.md; liefert null bei ungültigem Code oder zu kurzem Payload.
 */
export function decodeFashionCode(chatCode: string): FashionSlotEntry[] | null {
  if (!chatCode || typeof chatCode !== "string") return null;

  let payload: Buffer;
  try {
    payload = Buffer.from(extractBase64(chatCode), "base64");
  } catch {
    return null;
  }

  if (payload.length < MIN_PAYLOAD_LENGTH || payload[0] !== EQUIPMENT_TEMPLATE_TYPE) {
    return null;
  }

  const entries: FashionSlotEntry[] = [];

  for (const spec of SLOT_SPECS) {
    const skinId = readU16Safe(payload, spec.skinOffset);
    if (skinId === null) continue;

    let colorIds: (number | null)[] = [null, null, null, null];
    if (spec.dyeOffsets) {
      colorIds = spec.dyeOffsets.map((off) => {
        const v = readU16Safe(payload, off);
        return v === null || v === 0 ? null : v;
      });
    }

    entries.push({
      slot: spec.slot,
      skinId,
      colorIds,
    });
  }

  return entries;
}

/** Wardrobe-Skin-Chat-Link: Typ 0x0A, 3 Byte Skin-ID (24-bit LE), 1 Byte 0x00. */
const WARDROBE_SKIN_LINK_TYPE = 0x0a;

/**
 * Baut einen GW2-Chat-Link für einen Wardrobe-Skin (z. B. zum Kopieren in den Spiel-Chat).
 * Format: Header 0x0A, Skin-ID als 3 Byte Little-Endian, 1 Byte Null.
 */
export function buildSkinChatLink(skinId: number): string {
  if (skinId < 0 || skinId > 0xffffff) return "";
  const payload = Buffer.alloc(5);
  payload[0] = WARDROBE_SKIN_LINK_TYPE;
  payload.writeUIntLE(skinId, 1, 3);
  payload[4] = 0;
  return `[&${payload.toString("base64")}]`;
}
