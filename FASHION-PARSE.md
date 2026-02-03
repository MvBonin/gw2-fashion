# Fashion-Template-Payload (0x0F) – Byte-/Bit-Referenz

Nur verifizierte Bedeutungen; keine Vermutungen. Leer = nicht verifiziert.

---

## Byte-Tabelle (Payload 97 Bytes, Offset 0–96)

| Offset   | Länge | Bedeutung |
|----------|-------|-----------|
| 0        | 1     | Link-Typ: `0x0F` = Equipment/Fashion |
| 1–2      | 2B LE | Aquabreather Skin-ID (Slot 0) |
| 3–4      | 2B LE | Backpack Skin-ID (Slot 1) |
| 5–6      | 2B LE | Backpack Dye 1 (z. B. 1553 Permafrost) |
| 7–8      | 2B LE | Backpack Dye 2 (z. B. 1368 Gold Fusion) |
| 9–10     | 2B LE | Backpack Dye 3 (z. B. 1582 Grave) |
| 11–12    | 2B LE | Backpack Dye 4 (z. B. 1305 Electro Blue) |
| 13–14    | 2B LE | Coat (Slot 6) Skin-ID |
| 15–16    | 2B LE | Coat Dye 1 (z. B. 454 Tarnished Steel) |
| 17–18    | 2B LE | Coat Dye 2 (z. B. 480 Antique Gold) |
| 19–20    | 2B LE | Coat Dye 3 (z. B. 604 Deep Maple) |
| 21–22    | 2B LE | Coat Dye 4 (z. B. 435 Dijon) |
| 23–24    | 2B LE | Boots Skin-ID (Slot 11) |
| 25–26    | 2B LE | Boots Dye 1 (z. B. 1584 Worn Bone) |
| 27–28    | 2B LE | Boots Dye 2 (z. B. 1269 Amenity) |
| 29–30    | 2B LE | Boots Dye 3 (z. B. 1371 Harrowing Maroon) |
| 31–32    | 2B LE | Boots Dye 4 (z. B. 1 Dye Remover) |
| 33–34    | 2B LE | Gloves Skin-ID (Slot 16) |
| 35–36    | 2B LE | Gloves Dye 1 (z. B. 1553 Permafrost) |
| 37–38    | 2B LE | Gloves Dye 2 (z. B. 1354 Shadow Abyss) |
| 39–40    | 2B LE | Gloves Dye 3 (z. B. 1645 Exodus) |
| 41–42    | 2B LE | Gloves Dye 4 (z. B. 1 Dye Remover) |
| 43–44    | 2B LE | Block 0 Skin-ID (Helm) |
| 45–46    | 2B LE | Block 0 Dye 1 (z. B. 19 Ebony) |
| 47–48    | 2B LE | Block 0 Dye 2 (101 Stone) |
| 49–50    | 2B LE | Block 0 Dye 3 (376 Salmon) |
| 51–52    | 2B LE | Block 0 Dye 4 (377 Autumn) |
| 53–54    | 2B LE | Block 1 Skin-ID (Leggings) |
| 55–56    | 2B LE | Block 1 Dye 1 (z. B. Permafrost) |
| 57–58    | 2B LE | Block 1 Dye 2 (z. B. Shadow Abyss) |
| 59–60    | 2B LE | Block 1 Dye 3 (z. B. Exodus) |
| 61–62    | 2B LE | Block 1 Dye 4 |
| 63–64    | 2B LE | Block 2 Skin-ID (Shoulders) |
| 65–66    | 2B LE | Block 2 Dye 1 (17 Pottery) |
| 67–68    | 2B LE | Block 2 Dye 2 (14 Camel) |
| 69–70    | 2B LE | Block 2 Dye 3 (109 Apricot) |
| 71–72    | 2B LE | Block 2 Dye 4 (457 Clay) |
| 73–74    | 2B LE | Block 3: Outfit-ID (z. B. 27 Royal Guard) |
| 75–76    | 2B LE | Outfit Dye 1 (z. B. 698 Strawberry) |
| 77–78    | 2B LE | Outfit Dye 2 |
| 79–80    | 2B LE | Outfit Dye 3 |
| 81–82    | 2B LE | Outfit Dye 4 |
| 83–84    | 2B LE | Block 4: Wasser Waffe 1 Skin-ID |
| 85–86    | 2B LE | Block 4: Wasser Waffe 2 Skin-ID |
| 87–88    | 2B LE | Waffen-Set 1 Mainhand Skin-ID (z. B. 4062 Iron Sword) |
| 89–90    | 2B LE | Waffen-Set 1 Nebenhand Skin-ID (z. B. 4062 Iron Sword) |
| 91–92    | 2B LE | Waffen-Set 2 Mainhand Skin-ID (z. B. 3962 Iron Axe) |
| 93–94    | 2B LE | Waffen-Set 2 Nebenhand Skin-ID (z. B. 3962 Iron Axe) |
| 95        | 1     | Toggle-Bits (siehe Tabelle Byte 95) |
| 96        | 1     | Toggle-Bits (siehe Tabelle Byte 96) |

---


## Byte 95 – Toggle-Bits (1 = sichtbar, 0 = ausgeblendet)

| Bit | Maske | Bedeutung |
|-----|-------|-----------|
| 0   | 0x01  | Aquabreather |
| 1   | 0x02  | Rücken (Backpack) |
| 2   | 0x04  | |
| 3   | 0x08  | |
| 4   | 0x10  | Handschuhe (Gloves) |
| 5   | 0x20  | Helm |
| 6   | 0x40  | |
| 7   | 0x80  | Schultern (Shoulders) |

---

## Byte 96 – Toggle-Bits (1 = an/sichtbar, 0 = aus/ausgeblendet)

| Bit | Maske | Bedeutung |
|-----|-------|-----------|
| 0   | 0x01  | Outfit |
| 1   | 0x02  | Wasser Waffe 1 |
| 2   | 0x04  | Wasser Waffe 2 |
| 3   | 0x08  | Waffe Set 1 Mainhand |
| 4   | 0x10  | Waffe Set 1 Offhand |
| 5   | 0x20  | Waffe Set 2 Mainhand |
| 6   | 0x40  | Waffe Set 2 Offhand |
| 7   | 0x80  | |
