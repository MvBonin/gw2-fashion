"use client";

import { useState } from "react";
import Image from "next/image";
import { Copy, Check, BookOpen } from "lucide-react";
import { skinNameToWikiUrl, colorNameToWikiUrl } from "@/lib/gw2/wikiUrl";
import { buildSkinChatLink } from "@/lib/gw2/chatLink";

export interface EquipmentSlotSkin {
  id: number;
  name: string;
  icon?: string;
}

export interface EquipmentSlotColor {
  hex: string;
  name?: string;
  id?: number;
}

interface EquipmentSlotDisplayProps {
  skin: EquipmentSlotSkin;
  colors: EquipmentSlotColor[];
  hidden?: boolean;
}

const BOX_SIZE = 80;

async function copySkinLinkToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

export default function EquipmentSlotDisplay({
  skin,
  colors,
  hidden = false,
}: EquipmentSlotDisplayProps) {
  const [skinLinkCopied, setSkinLinkCopied] = useState(false);
  const skinWikiUrl = skinNameToWikiUrl(skin.name);
  const skinChatLink = buildSkinChatLink(skin.id);

  const effectiveColors = colors.length > 0 ? colors : [];
  const colorCount = effectiveColors.length;

  return (
    <div className="flex flex-col gap-1">
      {/* Überschrift: Skin-Name links, Chat-Link + Wiki rechtsbündig */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <a
          href={skinWikiUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-base-content link link-hover truncate min-w-0"
          title={skin.name}
        >
          {skin.name}
        </a>
        <div className="flex items-center gap-1 shrink-0">
          {skinChatLink && (
            <button
              type="button"
              onClick={() => {
                copySkinLinkToClipboard(skinChatLink).then(() => {
                  setSkinLinkCopied(true);
                  setTimeout(() => setSkinLinkCopied(false), 2000);
                });
              }}
              className="btn btn-ghost btn-xs btn-square"
              title="copy chat link"
              aria-label="copy chat link"
            >
              {skinLinkCopied ? (
                <Check className="w-3.5 h-3.5 text-success" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          )}
          <a
            href={skinWikiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost btn-xs btn-square"
            title="GW2 Wiki"
            aria-label="GW2 Wiki"
          >
            <BookOpen className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      <div
        className={`relative flex items-stretch gap-2 rounded-lg border border-base-300 bg-base-200/50 p-2 ${
          hidden ? "opacity-60" : ""
        }`}
      >
        {hidden && (
          <span className="absolute top-2 right-2 badge badge-ghost badge-sm text-base-content/60 z-10">
            Hidden
          </span>
        )}

        {/* Weiß umrahmtes Skin-Quadrat (nur Icon) */}
        <div
          className="shrink-0 rounded border-2 border-white bg-base-300 overflow-hidden flex items-center justify-center"
          style={{ width: BOX_SIZE, height: BOX_SIZE, minWidth: BOX_SIZE, minHeight: BOX_SIZE }}
        >
          {skin.icon ? (
            <a
              href={skinWikiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full h-full relative"
              title="GW2 Wiki"
            >
              <Image
                src={skin.icon}
                alt=""
                width={BOX_SIZE}
                height={BOX_SIZE}
                className="object-cover w-full h-full"
              />
            </a>
          ) : (
            <div className="w-full h-full flex items-center justify-center" title={skin.name}>
              <svg className="w-8 h-8 text-base-content/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
              </svg>
            </div>
          )}
        </div>

      {/* Rechts: Farb-Quadrat (1–4 Farben) */}
      <div
        className="shrink-0 rounded border border-base-300 overflow-hidden grid bg-base-300"
        style={{
          width: BOX_SIZE,
          height: BOX_SIZE,
          minWidth: BOX_SIZE,
          minHeight: BOX_SIZE,
          gridTemplateColumns: colorCount === 2 || colorCount === 3 || colorCount === 4 ? "1fr 1fr" : "1fr",
          gridTemplateRows:
            colorCount === 1 ? "1fr" : colorCount === 2 ? "1fr 1fr" : "1fr 1fr",
        }}
      >
        {colorCount === 1 && (
          <ColorCell color={effectiveColors[0]} />
        )}
        {colorCount === 2 && (
          <>
            <ColorCell color={effectiveColors[0]} />
            <ColorCell color={effectiveColors[1]} />
          </>
        )}
        {colorCount === 3 && (
          <>
            <div className="col-span-2">
              <ColorCell color={effectiveColors[0]} />
            </div>
            <ColorCell color={effectiveColors[1]} />
            <ColorCell color={effectiveColors[2]} />
          </>
        )}
        {colorCount === 4 && (
          <>
            <ColorCell color={effectiveColors[0]} />
            <ColorCell color={effectiveColors[1]} />
            <ColorCell color={effectiveColors[2]} />
            <ColorCell color={effectiveColors[3]} />
          </>
        )}
      </div>

      {/* Farbnamen: nutzen Platz bis rechts, bei Bedarf mit Ellipse abschneiden */}
      <div className="flex flex-col gap-0.5 justify-center text-xs text-base-content/70 min-w-0 flex-1">
        {effectiveColors.map((c, i) => (
          <span key={i} className="flex items-center min-w-0">
            <a
              href={c.name ? colorNameToWikiUrl(c.name) : undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="link link-hover truncate block min-w-0"
              title={c.name ? `${c.name} (${c.hex})` : c.hex}
            >
              {c.name ?? c.hex}
            </a>
          </span>
        ))}
      </div>
      </div>
    </div>
  );
}

function ColorCell({ color }: { color: EquipmentSlotColor }) {
  const wikiUrl = color.name ? colorNameToWikiUrl(color.name) : undefined;
  const content = (
    <span
      className="block w-full h-full border border-base-content/10"
      style={{ backgroundColor: color.hex }}
      title={color.name ? `${color.name} (${color.hex})` : color.hex}
    />
  );
  if (wikiUrl) {
    return (
      <a href={wikiUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-full" title={color.hex}>
        {content}
      </a>
    );
  }
  return content;
}
