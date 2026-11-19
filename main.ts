// Global Chronicle — news-image-20261119
// A one-day newspaper front page for Thursday 19 November 2026.
// Fresh code written from UNIFIED-SPEC.md only. Node 22, stdlib only,
// no network, no randomness, deterministic output.
//
// Rendering: a 5x7 master bitmap font, scaled by integer or 2.5x with
// nearest-neighbour pixel replication. Canvas 1024x1024, RGB PNG.

import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const W = 1024;
const H = 1024;

// ---- palette (UNIFIED-SPEC section 1, layout lane section 7) ----
const PAPER: [number, number, number] = [245, 240, 232];
const INK: [number, number, number] = [26, 26, 26];
const MUTED: [number, number, number] = [42, 42, 42];
const RED: [number, number, number] = [200, 16, 46];
const GREEN: [number, number, number] = [13, 122, 43];
const AMBER: [number, number, number] = [212, 107, 8];
const DEEPRED: [number, number, number] = [139, 46, 46];
const BLUE: [number, number, number] = [30, 58, 138];
const SEPIA: [number, number, number] = [107, 78, 26];
const YELLOW: [number, number, number] = [212, 175, 55];

type RGB = [number, number, number];

// ---- 5x7 master font ----
// Each glyph is 7 rows of 5 cells, "#" = ink, "." = empty.
// Letters A-Z, digits 0-9, space and punctuation used by the spec:
// , . : ; - (hyphen) – (en dash) − (minus, same bitmap as hyphen)
// % $ € + ~ ▲ ▼ | ' & /
// All strings in the image are rendered uppercase through this set.
const GLYPHS: Record<string, string[]> = {
  "A": ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  "B": ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  "C": ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  "D": ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  "E": ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  "F": ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  "G": ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  "H": ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  "I": ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  "J": ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  "K": ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  "L": ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  "M": ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  "N": ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  "O": ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  "P": ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  "Q": ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  "R": ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  "S": ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  "T": ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  "U": ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  "V": ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  "W": ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  "X": ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  "Y": ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  "Z": ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["01110", "10000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  ",": ["00000", "00000", "00000", "00000", "00100", "00100", "01000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  ":": ["00000", "01100", "01100", "00000", "01100", "01100", "00000"],
  ";": ["00000", "01100", "01100", "00000", "01100", "00100", "01000"],
  "-": ["00000", "00000", "00000", "01110", "00000", "00000", "00000"],
  "–": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  "−": ["00000", "00000", "00000", "01110", "00000", "00000", "00000"],
  "%": ["11001", "11001", "00100", "01000", "10011", "10011", "00000"],
  "$": ["00100", "01111", "10100", "01110", "00101", "11110", "00100"],
  "€": ["01110", "10001", "11110", "10000", "11110", "10001", "01110"],
  "+": ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
  "~": ["00000", "00000", "01101", "10010", "00000", "00000", "00000"],
  "▲": ["00100", "01110", "11111", "11111", "11111", "00000", "00000"],
  "▼": ["11111", "11111", "11111", "01110", "00100", "00000", "00000"],
  "|": ["00100", "00100", "00100", "00100", "00100", "00100", "00100"],
  "'": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
  "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
};

// ---- canvas ----
const px = new Uint8Array(W * H * 3);
function fill(c: RGB): void {
  for (let i = 0; i < W * H; i++) {
    px[i * 3] = c[0];
    px[i * 3 + 1] = c[1];
    px[i * 3 + 2] = c[2];
  }
}
function rect(x: number, y: number, w: number, h: number, c: RGB): void {
  const x0 = Math.max(0, Math.floor(x));
  const y0 = Math.max(0, Math.floor(y));
  const x1 = Math.min(W, Math.ceil(x + w));
  const y1 = Math.min(H, Math.ceil(y + h));
  for (let yy = y0; yy < y1; yy++) {
    for (let xx = x0; xx < x1; xx++) {
      const i = (yy * W + xx) * 3;
      px[i] = c[0];
      px[i + 1] = c[1];
      px[i + 2] = c[2];
    }
  }
}
// Filled circle (for icon dots / heads), integer rasterisation.
function disc(cx: number, cy: number, r: number, c: RGB): void {
  for (let yy = Math.floor(cy - r); yy <= Math.ceil(cy + r); yy++) {
    for (let xx = Math.floor(cx - r); xx <= Math.ceil(cx + r); xx++) {
      const dx = xx + 0.5 - cx;
      const dy = yy + 0.5 - cy;
      if (dx * dx + dy * dy <= r * r) rect(xx, yy, 1, 1, c);
    }
  }
}
// Straight line of thickness t (horizontal, vertical, or 45-degree-ish
// via stepping); used only for icon strokes.
function line(x0: number, y0: number, x1: number, y1: number, t: number, c: RGB): void {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const steps = Math.max(Math.abs(dx), Math.abs(dy), 1);
  for (let i = 0; i <= steps; i++) {
    const x = Math.round(x0 + (dx * i) / steps);
    const y = Math.round(y0 + (dy * i) / steps);
    rect(x - Math.floor(t / 2), y - Math.floor(t / 2), t, t, c);
  }
}

// ---- text ----
// Advance per character = 6 * scale; last glyph is 5 * scale wide.
function textWidth(s: string, sc: number): number {
  if (s.length === 0) return 0;
  return s.length * 6 * sc - sc;
}
function drawGlyph(ch: string, x: number, y: number, sc: number, c: RGB): void {
  const g = GLYPHS[ch];
  if (!g) return; // unknown char: leave blank (should never happen)
  for (let row = 0; row < 7; row++) {
    const bits = g[row];
    for (let col = 0; col < 5; col++) {
      if (bits[col] !== "1") continue;
      if (sc === 2.5) {
        const rx0 = Math.round(x + col * 2.5);
        const ry0 = Math.round(y + row * 2.5);
        const rx1 = Math.round(x + (col + 1) * 2.5);
        const ry1 = Math.round(y + (row + 1) * 2.5);
        rect(rx0, ry0, Math.max(1, rx1 - rx0), Math.max(1, ry1 - ry0), c);
      } else {
        rect(x + col * sc, y + row * sc, sc, sc, c);
      }
    }
  }
}
function drawText(s: string, x: number, y: number, sc: number, c: RGB): void {
  // Strings are stored uppercase already; normalise defensively.
  const t = s.toUpperCase();
  for (let i = 0; i < t.length; i++) {
    drawGlyph(t[i], x + i * 6 * sc, y, sc, c);
  }
}
function drawTextCentred(s: string, cx: number, y: number, sc: number, c: RGB): void {
  drawText(s, cx - textWidth(s.toUpperCase(), sc) / 2, y, sc, c);
}

// ---- PNG encoder (stdlib zlib, fixed compression, deterministic) ----
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let v = n;
  for (let k = 0; k < 8; k++) v = v & 1 ? 0xedb88320 ^ (v >>> 1) : v >>> 1;
  CRC_TABLE[n] = v >>> 0;
}
function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, "ascii"), data])), 8 + data.length);
  return out;
}
function encodePNG(): Buffer {
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0; // filter: none
    raw.set(px.subarray(y * W * 3, (y + 1) * W * 3), y * (1 + W * 3) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---- icons (layout lane section 5 recipes, 48x48 box, accent colour) ----
// Box origin (bx, by) is the top-left of the 48x48 icon box.
function iconLeaders(bx: number, by: number, c: RGB): void {
  // Three seated silhouettes around a table: heads + shoulders + table.
  const heads = [8, 20, 32];
  for (const hx of heads) {
    disc(bx + hx + 5, by + 12, 5, c);
    rect(bx + hx, by + 19, 10, 12, c);
  }
  rect(bx + 2, by + 34, 44, 5, c);
  rect(bx + 6, by + 39, 3, 7, c);
  rect(bx + 39, by + 39, 3, 7, c);
}
function iconRadar(bx: number, by: number, c: RGB): void {
  // Radar dish: arc bowl + sweep lines + centre dot + burst.
  const cx = bx + 24;
  const cy = by + 30;
  for (let a = 0; a <= 180; a += 3) {
    const r = (a * Math.PI) / 180;
    const x = Math.round(cx + Math.cos(r) * 18);
    const y = Math.round(cy - Math.sin(r) * 18);
    rect(x, y, 2, 2, c);
  }
  line(cx, cy, cx - 13, cy - 13, 2, c);
  line(cx, cy, cx, cy - 18, 2, c);
  line(cx, cy, cx + 13, cy - 13, 2, c);
  disc(cx, cy, 3, c);
  // Strike burst above the dish.
  line(bx + 24, by + 2, bx + 24, by + 8, 2, RED);
  line(bx + 18, by + 4, bx + 22, by + 8, 2, RED);
  line(bx + 30, by + 4, bx + 26, by + 8, 2, RED);
}
function iconBridge(bx: number, by: number, c: RGB): void {
  // Two arcs over water, deck line, three suspenders, waves below.
  // Left arc: centre (14,24) radius 12, upper half.
  for (let a = 180; a >= 0; a -= 4) {
    const r = (a * Math.PI) / 180;
    rect(Math.round(bx + 14 + Math.cos(r) * 12), Math.round(by + 24 - Math.sin(r) * 12), 2, 2, c);
  }
  // Right arc: centre (34,24) radius 12, upper half.
  for (let a = 180; a >= 0; a -= 4) {
    const r = (a * Math.PI) / 180;
    rect(Math.round(bx + 34 + Math.cos(r) * 12), Math.round(by + 24 - Math.sin(r) * 12), 2, 2, c);
  }
  rect(bx + 2, by + 24, 44, 3, c); // deck
  line(bx + 14, by + 27, bx + 14, by + 36, 2, c);
  line(bx + 24, by + 27, bx + 24, by + 36, 2, c);
  line(bx + 34, by + 27, bx + 34, by + 36, 2, c);
  line(bx + 4, by + 42, bx + 14, by + 42, 2, c);
  line(bx + 18, by + 42, bx + 28, by + 42, 2, c);
  line(bx + 32, by + 42, bx + 44, by + 42, 2, c);
}
function iconChip(bx: number, by: number, c: RGB): void {
  // Chip: outer square, pins on all sides, centre core.
  rect(bx + 8, by + 8, 32, 2, c);
  rect(bx + 8, by + 38, 32, 2, c);
  rect(bx + 8, by + 8, 2, 32, c);
  rect(bx + 38, by + 8, 2, 32, c);
  for (let i = 0; i < 4; i++) {
    const p = 12 + i * 7;
    rect(bx + p, by + 3, 3, 5, c);
    rect(bx + p, by + 40, 3, 5, c);
    rect(bx + 3, by + p, 5, 3, c);
    rect(bx + 40, by + p, 5, 3, c);
  }
  rect(bx + 18, by + 18, 12, 12, c);
}
function iconGavel(bx: number, by: number, c: RGB): void {
  // Gavel: head top-left, handle diagonal down-right, sound block.
  rect(bx + 6, by + 6, 26, 10, c);
  rect(bx + 4, by + 4, 4, 14, c);
  line(bx + 24, by + 16, bx + 40, by + 38, 4, c);
  rect(bx + 30, by + 40, 14, 4, c);
}
function iconCandles(bx: number, by: number, c: RGB): void {
  // Candlesticks: two red down bars, one green up bar, wicks.
  rect(bx + 6, by + 12, 8, 22, RED);
  line(bx + 10, by + 4, bx + 10, by + 12, 2, RED);
  line(bx + 10, by + 34, bx + 10, by + 44, 2, RED);
  rect(bx + 20, by + 20, 8, 14, GREEN);
  line(bx + 24, by + 12, bx + 24, by + 20, 2, GREEN);
  line(bx + 24, by + 34, bx + 24, by + 40, 2, GREEN);
  rect(bx + 34, by + 8, 8, 26, RED);
  line(bx + 38, by + 2, bx + 38, by + 8, 2, RED);
  line(bx + 38, by + 34, bx + 38, by + 44, 2, RED);
}
function iconGaza(bx: number, by: number, c: RGB): void {
  // Small map outline with a horizontal yellow line + tank silhouette.
  rect(bx + 4, by + 6, 40, 2, INK);
  rect(bx + 4, by + 6, 2, 24, INK);
  rect(bx + 42, by + 6, 2, 24, INK);
  rect(bx + 4, by + 28, 40, 2, INK);
  rect(bx + 4, by + 18, 40, 3, YELLOW);
  rect(bx + 12, by + 34, 22, 6, INK); // tank hull
  rect(bx + 18, by + 30, 10, 4, INK); // turret
  line(bx + 28, by + 32, bx + 40, by + 32, 2, INK); // barrel
  disc(bx + 17, by + 42, 2, INK);
  disc(bx + 25, by + 42, 2, INK);
  disc(bx + 33, by + 42, 2, INK);
}

// ---- story blocks (UNIFIED-SPEC section 5; strings verbatim, uppercased) ----
// Accent bar is 4px at the TOP of each block (spec section 1 overrides
// the layout lane's bottom bar). Icons sit top-right for A, B, F, G
// (their headlines are short enough to clear the icon) and bottom-right
// for C, D, E (their headlines run wide).
type IconFn = (bx: number, by: number, c: RGB) => void;
interface Story {
  x: number; y: number; w: number; h: number;
  accent: RGB; kicker: string; headline: string[]; headScale: number;
  deck: string[]; stats: string[]; icon: IconFn; iconTop: boolean;
  headX: number; // extra left offset for the headline (D needs 4px)
  tight?: boolean; // tighter vertical rhythm (F: 160px must hold 2+3+2 lines)
}
const STORIES: Story[] = [
  {
    x: 32, y: 144, w: 680, h: 256, accent: RED, kicker: "WORLD DIPLOMACY",
    headline: ["TRUMP, XI, PUTIN", "CONVENE IN SHENZHEN"], headScale: 4,
    deck: ["FIRST-EVER TRILATERAL SUMMIT OPENS IN CHINA ON NUCLEAR", "ARMS AND TRADE."],
    stats: ["3-WAY TALKS", "KYLIN VILLA | APEC SIDELINES"],
    icon: iconLeaders, iconTop: true, headX: 0,
  },
  {
    x: 736, y: 144, w: 256, h: 256, accent: AMBER, kicker: "GULF ESCALATION",
    headline: ["IRAN HITS", "KUWAIT BASE"], headScale: 3,
    deck: ["ALI AL SALEM HIT", "AFTER THIRD BAHRAIN", "ATTACK WAVE."],
    stats: ["3 US CARRIERS", "53,000 TROOPS", "HIT 30X IN WAR"],
    icon: iconRadar, iconTop: true, headX: 0,
  },
  {
    x: 32, y: 416, w: 288, h: 224, accent: DEEPRED, kicker: "EASTERN EUROPE",
    headline: ["CRIMEAN BRIDGE", "HIT AGAIN"], headScale: 3,
    deck: ["TRAFFIC HALTED AGAIN", "AS BRIDGE TAKES ITS", "THIRD HIT IN A WEEK."],
    stats: ["DAY 3 STRIKE"],
    icon: iconBridge, iconTop: false, headX: 0,
  },
  {
    x: 336, y: 416, w: 352, h: 224, accent: GREEN, kicker: "MARKET RECORD",
    headline: ["ANTHROPIC RAISES $81.3B", "IN RECORD IPO"], headScale: 2.5,
    deck: ["PRICED AT $83, PIONEER AI", "LAB REACHES ~$1.5T NASDAQ", "LISTING."],
    stats: ["$81.3B RAISED", "980M SHARES", "NASDAQ: ANT"],
    icon: iconChip, iconTop: false, headX: 4,
  },
  {
    x: 704, y: 416, w: 288, h: 224, accent: BLUE, kicker: "US CONGRESS",
    headline: ["JEFFRIES 251–11", "FIRST BLACK", "SPEAKER"], headScale: 2.5,
    deck: ["HOUSE DEMOCRATS VOTE", "251–11; FLOOR VOTE", "JANUARY 3."],
    stats: ["JAN 3, 2027"],
    icon: iconGavel, iconTop: false, headX: 0,
  },
  {
    x: 32, y: 768, w: 464, h: 160, accent: RED, kicker: "WALL STREET",
    headline: ["DOW PLUNGES 561 AS S&P", "FALLS 5TH DAY"], headScale: 3,
    deck: ["HAWKISH FEDERAL RESERVE MINUTES", "TRIGGER SELLOFF; NASDAQ BOUNCES."],
    stats: ["NASDAQ +0.4% | NVDA $150.96 -2.9%", "VIX 25"],
    icon: iconCandles, iconTop: true, headX: 0, tight: true,
  },
  {
    x: 512, y: 768, w: 480, h: 160, accent: SEPIA, kicker: "GAZA",
    headline: ["GAZA GROUND PUSH"], headScale: 3,
    deck: ["ISRAEL LAUNCHES RARE GAZA PUSH."],
    stats: ["3 KILLED", "1ST SINCE OCT 2025"],
    icon: iconGaza, iconTop: true, headX: 0,
  },
];

// Vertical rhythm inside a block (all offsets from block top y):
// accent bar 0..4; kicker top +12; headline top +34; deck follows the
// headline; stats are anchored to the block bottom (last line ends 10px
// above the block bottom). Line pitches: headline cap+6 (s4: 34, s3: 27,
// s2.5: 24), deck/stat pitch 17.
function headPitch(sc: number): number {
  return Math.round(7 * sc + 6);
}
function drawStory(s: Story): void {
  const tx = s.x + 8; // 8px inside padding
  rect(s.x, s.y, s.w, 4, s.accent); // accent bar at top
  const kickerY = s.y + (s.tight ? 10 : 12);
  const headY = s.y + (s.tight ? 28 : 34);
  const hp = s.tight ? Math.round(7 * s.headScale + 3) : headPitch(s.headScale);
  const deckPitch = s.tight ? 15 : 17;
  const statPitch = s.tight ? 15 : 17;
  const bottomPad = s.tight ? 6 : 10;
  drawText(s.kicker, tx, kickerY, 2, RED);
  let y = headY;
  for (const ln of s.headline) {
    drawText(ln, tx + s.headX, y, s.headScale, INK);
    y += hp;
  }
  y += s.tight ? 4 : 6;
  for (const ln of s.deck) {
    drawText(ln, tx, y, 2, MUTED);
    y += deckPitch;
  }
  // Stats anchored to the bottom: last stat line ends bottomPad above bottom.
  const statTop = s.y + s.h - bottomPad - s.stats.length * statPitch;
  for (let i = 0; i < s.stats.length; i++) {
    drawText(s.stats[i], tx, statTop + i * statPitch, 2, INK);
  }
  if (s.iconTop) {
    s.icon(s.x + s.w - 56, s.y + 10, s.accent);
  } else {
    s.icon(s.x + s.w - 56, s.y + s.h - 58, s.accent);
  }
}

// ---- masthead, markets strip, footer, main ----
// Masthead band 0..128: title s=6, date s=4, sub-tag s=2, red rule.
function drawMasthead(): void {
  drawTextCentred("GLOBAL CHRONICLE", 512, 10, 6, INK);
  drawTextCentred("THURSDAY, 19 NOVEMBER 2026", 512, 60, 4, INK);
  drawTextCentred("FINAL EDITION - 24-HOUR GLOBAL ROUNDUP", 512, 96, 2, MUTED);
  rect(32, 118, 960, 3, RED);
}

// Markets strip y656 h96, charcoal bar, paper text, s=2, two rows of
// 3 items centred as a group (UNIFIED-SPEC section 6).
function drawStrip(): void {
  rect(32, 656, 960, 96, INK);
  const row1 = "DOW -561 ▼ -1.1% | S&P -0.2% ▼ | NASDAQ +0.4% ▲";
  const row2 = "ANT $83 $81.3B | GOLD $3,767 ▼ 14-MO | VIX 25 ▲ ELEVATED";
  drawTextCentred(row1, 512, 682, 2, PAPER);
  drawTextCentred(row2, 512, 712, 2, PAPER);
}

// Footer y944 h80: 1px rule, two centred s=2 lines (spec section 7).
function drawFooter(): void {
  rect(32, 944, 960, 1, INK);
  drawTextCentred("SOURCES: NYT | BLOOMBERG | REUTERS | AP | BBC", 512, 962, 2, MUTED);
  drawTextCentred("GLOBAL CHRONICLE - 19 NOVEMBER 2026", 512, 986, 2, MUTED);
}

function main(): void {
  fill(PAPER);
  drawMasthead();
  for (const s of STORIES) drawStory(s);
  drawStrip();
  drawFooter();
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "entry.png"), encodePNG());
}

main();
