export type DitherMode = "floyd" | "bayer" | "hard";

export interface SceneState {
  x: number; // geser horizontal (px stage)
  y: number; // geser vertikal
  s: number; // skala (cubitan / zoom)
  r: number; // rotasi derajat
}

export const PAPER_RGB: [number, number, number] = [250, 246, 235];
export const INK_RGB: [number, number, number] = [24, 33, 27];

/** Gambar image ke canvas dengan transform cover + user (geser, zoom, rotasi). */
export function drawScene(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource & { naturalWidth: number; naturalHeight: number },
  st: SceneState,
  size: number
) {
  ctx.clearRect(0, 0, size, size);
  const iw = img.naturalWidth || 1;
  const ih = img.naturalHeight || 1;
  const cover = Math.max(size / iw, size / ih);
  ctx.save();
  ctx.translate(size / 2 + st.x, size / 2 + st.y);
  ctx.rotate((st.r * Math.PI) / 180);
  const k = cover * st.s;
  ctx.scale(k, k);
  ctx.drawImage(img, -iw / 2, -ih / 2);
  ctx.restore();
}

/** Ambil luminance 0..255 dari seluruh isi canvas (persegi). */
export function grayFromCanvas(src: HTMLCanvasElement): Float32Array {
  const ctx = src.getContext("2d", { willReadFrequently: true })!;
  const data = ctx.getImageData(0, 0, src.width, src.height).data;
  const n = src.width * src.height;
  const gray = new Float32Array(n);
  for (let i = 0, p = 0; p < n; i += 4, p++) {
    gray[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  return gray;
}

/** Kontras sederhana di sekitar titik tengah, factor 0.5..2 */
export function applyContrast(gray: Float32Array, factor: number): Float32Array {
  const out = new Float32Array(gray.length);
  for (let i = 0; i < gray.length; i++) {
    out[i] = Math.min(255, Math.max(0, (gray[i] / 255 - 0.5) * factor * 255 + 127.5));
  }
  return out;
}

const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/** Dither 1-bit. Hasil: Uint8Array berisi 1 (putih/kertas) atau 0 (hitam/tinta). */
export function dither1bit(
  gray: Float32Array,
  w: number,
  h: number,
  mode: DitherMode,
  threshold: number
): Uint8Array {
  const n = w * h;
  const out = new Uint8Array(n);

  if (mode === "hard") {
    for (let i = 0; i < n; i++) out[i] = gray[i] > threshold ? 1 : 0;
    return out;
  }

  if (mode === "bayer") {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        const m = BAYER4[(y & 3) * 4 + (x & 3)];
        const v = gray[i] + ((m + 0.5) / 16 - 0.5) * 140;
        out[i] = v > threshold ? 1 : 0;
      }
    }
    return out;
  }

  // Floyd–Steinberg
  const err = new Float32Array(gray);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const old = err[i];
      const nv = old > threshold ? 255 : 0;
      out[i] = nv === 255 ? 1 : 0;
      const e = old - nv;
      if (x + 1 < w) err[i + 1] += (e * 7) / 16;
      if (y + 1 < h) {
        if (x > 0) err[i + w - 1] += (e * 3) / 16;
        err[i + w] += (e * 5) / 16;
        if (x + 1 < w) err[i + w + 1] += e / 16;
      }
    }
  }
  return out;
}

/** Gambar hasil 1-bit ke canvas (warna kertas vs tinta). */
export function blit1bit(canvas: HTMLCanvasElement, bin: Uint8Array, w: number, h: number) {
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(w, h);
  const d = img.data;
  for (let i = 0, p = 0; i < bin.length; i++, p += 4) {
    const c = bin[i] === 1 ? PAPER_RGB : INK_RGB;
    d[p] = c[0];
    d[p + 1] = c[1];
    d[p + 2] = c[2];
    d[p + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

export function makeCanvas(size: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  return c;
}
