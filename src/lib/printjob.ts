import { blit1bit, dither1bit, drawScene, grayFromCanvas, makeCanvas, applyContrast } from "./dither";
import type { DitherMode, SceneState } from "./dither";

/** Label 100×100 mm @ 203 dpi = 800×800 dot. Area foto 640×640 dot (80 mm). */
export const DOT_AREA = 640;
export const LABEL_MM = 100;

export type JobStatus = "antre" | "mencetak" | "selesai" | "offline";

export interface PrintJob {
  id: string;
  caption: string;
  owner: string;
  mode: DitherMode;
  ts: number;
  bin: Uint8Array; // 1-bit 640×640
  thumb: string; // dataURL kecil utk antrean
  status: JobStatus;
}

let seq = 40;
export function nextJobId(): string {
  seq += 1;
  return `#${String(seq).padStart(3, "0")}`;
}

export function fmtTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

/** Render foto (dengan transform user) → biner 640×640 + thumbnail + PNG resolusi penuh utk server. */
export function bakeJobImage(
  img: HTMLImageElement,
  st: SceneState,
  mode: DitherMode,
  threshold: number,
  contrast: number
): { bin: Uint8Array; thumb: string; full: string } {
  const c = makeCanvas(DOT_AREA);
  const ctx = c.getContext("2d")!;
  drawScene(ctx, img, st, DOT_AREA);
  let gray = grayFromCanvas(c);
  gray = applyContrast(gray, contrast);
  const bin = dither1bit(gray, DOT_AREA, DOT_AREA, mode, threshold);

  const full = makeCanvas(DOT_AREA);
  blit1bit(full, bin, DOT_AREA, DOT_AREA);
  const small = makeCanvas(160);
  const sctx = small.getContext("2d")!;
  sctx.imageSmoothingEnabled = false;
  sctx.drawImage(full, 0, 0, 160, 160);
  return { bin, thumb: small.toDataURL("image/png"), full: full.toDataURL("image/png") };
}

/* ---------- ZPL asli utk Zebra GC420T (203 dpi, lebar 832 dot) ---------- */

function sanitizeCaption(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[^\x20-\x7e]/g, "")
    .replace(/[\^~]/g, " ")
    .slice(0, 60);
}

export function buildZpl(job: PrintJob): string {
  const bytesPerRow = DOT_AREA / 8; // 80
  const totalBytes = (DOT_AREA * DOT_AREA) / 8; // 51200
  const hex: string[] = [];
  for (let i = 0; i < job.bin.length; i += 8) {
    let b = 0;
    for (let bit = 0; bit < 8; bit++) {
      if (job.bin[i + bit] === 0) b |= 0x80 >> bit; // 0 = tinta hitam
    }
    hex.push(b.toString(16).padStart(2, "0").toUpperCase());
  }
  const when = new Date(job.ts).toLocaleString("id-ID");
  const caption = sanitizeCaption(job.caption) || "CETAKYUK!";
  return [
    "^XA",
    "^MMT",
    "^PW832",
    "^LL832",
    "^LH0,0",
    `^FO80,24^GFA,${totalBytes},${totalBytes},${bytesPerRow},${hex.join("")}^FS`,
    `^FO80,696^A0N,44,44^FD${caption}^FS`,
    `^FO80,752^A0N,24,24^FDCETAKYUK ${job.id} - ${when} - ${LABEL_MM}x${LABEL_MM}mm 8dot/mm^FS`,
    "^PQ1",
    "^XZ",
  ].join("\n");
}

export function downloadZpl(job: PrintJob) {
  const blob = new Blob([buildZpl(job)], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cetakyuk-${job.id.replace("#", "")}.zpl`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/* ---------- gambar contoh (biar demo seru tanpa file) ---------- */

type SceneKind = "senyum" | "hati" | "bintang";

function doodleScene(kind: SceneKind): HTMLCanvasElement {
  const c = makeCanvas(1080);
  const ctx = c.getContext("2d")!;
  const P = {
    pine: "#1a5c46",
    leaf: "#7cc24b",
    mint: "#bce3ce",
    cream: "#f2e8cf",
    tang: "#f5873c",
    ink: "#1e2b22",
  };
  ctx.fillStyle = P.cream;
  ctx.fillRect(0, 0, 1080, 1080);

  if (kind === "senyum") {
    // matahari senyum gede
    ctx.save();
    ctx.translate(540, 500);
    ctx.strokeStyle = P.tang;
    ctx.lineWidth = 26;
    ctx.lineCap = "round";
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 330, Math.sin(a) * 330);
      ctx.lineTo(Math.cos(a) * 410, Math.sin(a) * 410);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, 0, 300, 0, Math.PI * 2);
    ctx.fillStyle = P.leaf;
    ctx.fill();
    ctx.lineWidth = 22;
    ctx.strokeStyle = P.ink;
    ctx.stroke();
    ctx.fillStyle = P.ink;
    ctx.beginPath();
    ctx.arc(-105, -70, 34, 0, Math.PI * 2);
    ctx.arc(105, -70, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.lineWidth = 24;
    ctx.arc(0, 30, 140, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = P.pine;
    ctx.font = "700 84px 'Bricolage Grotesque', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("halo dari kiosk!", 540, 980);
  } else if (kind === "hati") {
    const heart = (x: number, y: number, s: number, color: string, rot: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.scale(s, s);
      ctx.beginPath();
      ctx.moveTo(0, 28);
      ctx.bezierCurveTo(-60, -20, -30, -70, 0, -38);
      ctx.bezierCurveTo(30, -70, 60, -20, 0, 28);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.lineWidth = 7;
      ctx.strokeStyle = P.ink;
      ctx.stroke();
      ctx.restore();
    };
    heart(540, 470, 4.4, P.tang, -0.1);
    heart(250, 250, 1.6, P.leaf, 0.3);
    heart(860, 260, 1.3, P.mint, -0.25);
    heart(300, 820, 1.4, P.pine, -0.2);
    heart(820, 800, 1.8, P.leaf, 0.2);
  } else {
    const star = (x: number, y: number, r: number, color: string, rot: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const rr = i % 2 === 0 ? r : r * 0.45;
        const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
        ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.lineWidth = 8;
      ctx.lineJoin = "round";
      ctx.strokeStyle = P.ink;
      ctx.stroke();
      ctx.restore();
    };
    star(540, 430, 260, P.leaf, 0.15);
    star(220, 230, 110, P.tang, -0.3);
    star(880, 300, 90, P.mint, 0.4);
    star(260, 840, 100, P.mint, 0.2);
    star(850, 820, 130, P.tang, -0.15);
  }
  return c;
}

export function sampleImageDataURL(kind: SceneKind): string {
  return doodleScene(kind).toDataURL("image/png");
}

export function seedJobs(): PrintJob[] {
  const recipes: { kind: SceneKind; caption: string; owner: string; mode: DitherMode; status: JobStatus }[] = [
    { kind: "senyum", caption: "senyum dulu dong :)", owner: "tamu", mode: "floyd", status: "selesai" },
    { kind: "hati", caption: "buat kamu, semangat terus!", owner: "kiki", mode: "bayer", status: "antre" },
    { kind: "bintang", caption: "bintang lima buat hari ini", owner: "tamu", mode: "floyd", status: "offline" },
  ];
  return recipes.map((r, i) => {
    const img = new Image();
    img.src = sampleImageDataURL(r.kind);
    const c = makeCanvas(DOT_AREA);
    const ctx = c.getContext("2d")!;
    ctx.drawImage(doodleScene(r.kind), 0, 0, DOT_AREA, DOT_AREA);
    const gray = grayFromCanvas(c);
    const bin = dither1bit(gray, DOT_AREA, DOT_AREA, r.mode, 128);
    const full = makeCanvas(DOT_AREA);
    blit1bit(full, bin, DOT_AREA, DOT_AREA);
    const small = makeCanvas(160);
    const sctx = small.getContext("2d")!;
    sctx.imageSmoothingEnabled = false;
    sctx.drawImage(full, 0, 0, 160, 160);
    void img;
    return {
      id: `#${String(34 + i * 3).padStart(3, "0")}`,
      caption: r.caption,
      owner: r.owner,
      mode: r.mode,
      ts: Date.now() - (i + 1) * 7 * 60_000,
      bin,
      thumb: small.toDataURL("image/png"),
      status: r.status,
    };
  });
}
