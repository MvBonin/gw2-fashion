/**
 * Explorative script: GW2 Chat-Code-Struktur und API-Beschaffenheit.
 * Ausführung: npx tsx scripts/explore-gw2-api.ts
 */

const GW2_API_BASE = "https://api.guildwars2.com";

const WARDROBE_TEMPLATE_CODE =
  "[&D1oDPx4BAAEAAQABABcrMAZNBfUEWwUeADAG9QRbBQEAqDMZAEcCQwByBt4DTQUBAAEAAQDzKjAGTQX1BFsFvBj1BAEATQUBABsASgUBAAEAAQAHFAAAyhwXDwwPAAB9fg==]";

function extractBase64(chatCode: string): string {
  const match = chatCode.match(/^\[\&(.+)\]\s*$/);
  if (!match) throw new Error("Invalid chat code format");
  return match[1];
}

function decodeChatLinkPayload(chatCode: string): Buffer {
  const b64 = extractBase64(chatCode);
  return Buffer.from(b64, "base64");
}

function hexDump(buf: Buffer, maxBytes = 80): string {
  const len = Math.min(buf.length, maxBytes);
  const lines: string[] = [];
  for (let i = 0; i < len; i += 16) {
    const chunk = buf.subarray(i, Math.min(i + 16, len));
    const hex = Array.from(chunk)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(" ");
    const ascii = Array.from(chunk)
      .map((b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : "."))
      .join("");
    lines.push(`${i.toString(16).padStart(4, "0")}  ${hex.padEnd(48)}  ${ascii}`);
  }
  return lines.join("\n");
}

// Link-Typen laut GW2 Wiki Chat link format
const LINK_TYPES: Record<number, string> = {
  0x01: "Coin",
  0x02: "Item",
  0x03: "NPC text",
  0x04: "Map",
  0x05: "PvP Game",
  0x06: "Skill",
  0x07: "Trait",
  0x08: "User",
  0x09: "Recipe",
  0x0a: "Wardrobe skin",
  0x0b: "Outfit",
  0x0c: "WvW objective",
  0x0d: "Build template",
  0x0e: "Achievement",
  0x0f: "Equipment/Fashion template (undokumentiert, vermutet)",
};

async function main() {
  console.log("=== 1. Chat-Code dekodieren ===\n");

  const payload = decodeChatLinkPayload(WARDROBE_TEMPLATE_CODE);
  const linkType = payload[0];
  const typeName = LINK_TYPES[linkType] ?? `Unknown (0x${linkType.toString(16)})`;

  console.log("Roher Code:", WARDROBE_TEMPLATE_CODE);
  console.log("Payload-Länge:", payload.length, "Bytes");
  console.log("Erstes Byte (Link-Typ):", linkType, "= 0x" + linkType.toString(16), "=", typeName);
  console.log("\nHex-Dump (erste 80 Bytes):");
  console.log(hexDump(payload, 80));
  console.log("\nVollständiger Hex-String (alle Bytes):");
  console.log(payload.toString("hex"));

  console.log("\n=== 2. GW2-API: /v2/skins (ohne Key) ===\n");

  const skinsRes = await fetch(`${GW2_API_BASE}/v2/skins?ids=1,2,10`);
  console.log("Status:", skinsRes.status, skinsRes.statusText);
  const skins = await skinsRes.json();
  if (Array.isArray(skins)) {
    console.log("Anzahl:", skins.length);
    console.log("Struktur (erster Eintrag):", JSON.stringify(skins[0], null, 2));
  } else {
    console.log("Antwort:", JSON.stringify(skins, null, 2));
  }

  console.log("\n=== 3. GW2-API: /v2/colors (ohne Key) ===\n");

  const colorsRes = await fetch(`${GW2_API_BASE}/v2/colors?ids=1,2,48`);
  console.log("Status:", colorsRes.status, colorsRes.statusText);
  const colors = await colorsRes.json();
  if (Array.isArray(colors)) {
    console.log("Anzahl:", colors.length);
    console.log("Struktur (erster Eintrag):", JSON.stringify(colors[0], null, 2));
  } else {
    console.log("Antwort:", JSON.stringify(colors, null, 2));
  }

  const apiKey = process.env.GW2_API_KEY_TEST;
  if (apiKey) {
    console.log("\n=== 4. GW2-API: tokeninfo (mit GW2_API_KEY_TEST) ===\n");
    const tokenRes = await fetch(`${GW2_API_BASE}/v2/tokeninfo?access_token=${apiKey}`);
    console.log("Status:", tokenRes.status, tokenRes.statusText);
    const token = await tokenRes.json();
    console.log("Tokeninfo:", JSON.stringify(token, null, 2));
  } else {
    console.log("\n=== 4. GW2_API_KEY_TEST nicht gesetzt – tokeninfo übersprungen ===\n");
  }

  console.log("\n=== Ende ===\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
