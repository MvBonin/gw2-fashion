/**
 * GW2-Wiki-URLs: Konvention für Skin- und Farb-Seiten.
 * Die API liefert keine Wiki-Links; Namen werden zu Wiki-Titeln normalisiert.
 */

const WIKI_BASE = "https://wiki.guildwars2.com/wiki";

/**
 * Wandelt einen Anzeigenamen in einen GW2-Wiki-Seitentitel um:
 * Leerzeichen → Unterstrich, Sonderzeichen URL-encodiert.
 */
function toWikiTitle(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "";
  return encodeURIComponent(trimmed).replace(/%20/g, "_");
}

/**
 * URL zur Skin-Seite (Format: Name_(skin)).
 */
export function skinNameToWikiUrl(name: string): string {
  const title = toWikiTitle(name);
  if (!title) return WIKI_BASE;
  return `${WIKI_BASE}/${title}_(skin)`;
}

/**
 * URL zur Farb-/Dye-Seite (Format: Name).
 */
export function colorNameToWikiUrl(name: string): string {
  const title = toWikiTitle(name);
  if (!title) return WIKI_BASE;
  return `${WIKI_BASE}/${title}`;
}
