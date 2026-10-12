import { useCallback, useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import confetti from "canvas-confetti";
import { drawScene, makeCanvas, grayFromCanvas, applyContrast, dither1bit, blit1bit, type DitherMode, type SceneState } from "../lib/dither";
import { bakeJobImage, nextJobId, sampleImageDataURL, DOT_AREA, type JobStatus, type PrintJob } from "../lib/printjob";
import { useApp } from "../state";
import {
  CameraIcon, GalleryIcon, ImageIcon, PinchIcon, RotateIcon, ResetIcon, SendIcon, SparkIcon,
  ZoomInIcon, ZoomOutIcon, PenIcon, XIcon, CheckIcon,
} from "./Icons";
import { MonoChip, Reveal, SectionHead } from "./ui";

const SIZE = 448; // resolusi preview internal
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

const MODES: { id: DitherMode; label: string }[] = [
  { id: "floyd", label: "Floyd–Steinberg" },
  { id: "bayer", label: "Bayer 4×4" },
  { id: "hard", label: "Garis Tegas" },
];

const SAMPLES = ["senyum", "hati", "bintang"] as const;

export default function Editor() {
  const { user, openLogin, toast, serverUrl, addJob } = useApp();
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [st, setSt] = useState<SceneState>({ x: 0, y: 0, s: 1, r: 0 });
  const [mode, setMode] = useState<DitherMode>("floyd");
  const [thr, setThr] = useState(128);
  const [contrast, setContrast] = useState(100);
  const [ditherOn, setDitherOn] = useState(true);
  const [caption, setCaption] = useState("");
  const [camOpen, setCamOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [fontTick, setFontTick] = useState(0);
  const sampleIdx = useRef(0);

  const stageWrap = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLCanvasElement>(null);
  const dithRef = useRef<HTMLCanvasElement>(null);
  const labelRef = useRef<HTMLCanvasElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; mid: { x: number; y: number } } | null>(null);

  /* redraw stage mentah */
  useEffect(() => {
    const c = stageRef.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    if (!img) {
      ctx.clearRect(0, 0, SIZE, SIZE);
      return;
    }
    drawScene(ctx, img, st, SIZE);
  }, [img, st]);

  /* dither hidup (debounce) */
  useEffect(() => {
    if (!img) return;
    const t = window.setTimeout(() => {
      const c = makeCanvas(SIZE);
      drawScene(c.getContext("2d")!, img, st, SIZE);
      const bin = dither1bit(applyContrast(grayFromCanvas(c), contrast / 100), SIZE, SIZE, mode, thr);
      if (dithRef.current) blit1bit(dithRef.current, bin, SIZE, SIZE);
    }, 60);
    return () => window.clearTimeout(t);
  }, [img, st, mode, thr, contrast]);

  /* pratinjau label 1:1 (800×800 dot) + caption */
  useEffect(() => {
    if (!img) return;
    const t = window.setTimeout(() => {
      const lc = labelRef.current;
      if (!lc) return;
      const photo = makeCanvas(DOT_AREA);
      drawScene(photo.getContext("2d")!, img, st, DOT_AREA);
      const bin = dither1bit(applyContrast(grayFromCanvas(photo), contrast / 100), DOT_AREA, DOT_AREA, mode, thr);
      const p2 = makeCanvas(DOT_AREA);
      blit1bit(p2, bin, DOT_AREA, DOT_AREA);

      lc.width = 800;
      lc.height = 800;
      const ctx = lc.getContext("2d")!;
      ctx.fillStyle = "#fdfaf1";
      ctx.fillRect(0, 0, 800, 800);
      ctx.drawImage(p2, 80, 24, DOT_AREA, DOT_AREA);
      ctx.strokeStyle = "#1e2b22";
      ctx.lineWidth = 4;
      ctx.strokeRect(80, 24, DOT_AREA, DOT_AREA);
      ctx.fillStyle = "#18211b";
      ctx.textAlign = "center";
      const text = caption.trim() || "…tuliskan sesuatu yang manis…";
      ctx.globalAlpha = caption.trim() ? 1 : 0.35;
      ctx.font = "600 46px Caveat, cursive";
      ctx.fillText(text, 400, 728, 720);
      ctx.globalAlpha = 1;
      ctx.font = "700 21px 'Space Mono', monospace";
      ctx.fillText(`CETAKYUK! • 100×100 MM • 8 DOT/MM`, 400, 772);
    }, 120);
    return () => window.clearTimeout(t);
  }, [img, st, mode, thr, contrast, caption, fontTick]);

  useEffect(() => {
    let alive = true;
    document.fonts?.ready.then(() => alive && setFontTick((v) => v + 1));
    return () => {
      alive = false;
    };
  }, []);

  /* ---------- interaksi panggung ---------- */
  const toInternal = (clientX: number, clientY: number) => {
    const rect = stageWrap.current!.getBoundingClientRect();
    const k = SIZE / rect.width;
    return { x: (clientX - rect.left - rect.width / 2) * k, y: (clientY - rect.top - rect.height / 2) * k, k };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!img) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const mid = toInternal((a.x + b.x) / 2, (a.y + b.y) / 2);
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), mid: { x: mid.x, y: mid.y } };
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(e.pointerId)) return;
    const prev = pointers.current.get(e.pointerId)!;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const mid = toInternal((a.x + b.x) / 2, (a.y + b.y) / 2);
      const k = dist / Math.max(1, pinch.current.dist);
      const dx = mid.x - pinch.current.mid.x;
      const dy = mid.y - pinch.current.mid.y;
      setSt((s) => {
        const ns = clamp(s.s * k, 0.5, 8);
        const kk = ns / s.s;
        return { ...s, s: ns, x: mid.x - (mid.x - s.x) * kk + dx, y: mid.y - (mid.y - s.y) * kk + dy };
      });
      pinch.current = { dist, mid: { x: mid.x, y: mid.y } };
    } else if (pointers.current.size === 1) {
      const p = toInternal(e.clientX, e.clientY);
      const q = toInternal(prev.x, prev.y);
      setSt((s) => ({ ...s, x: s.x + (p.x - q.x), y: s.y + (p.y - q.y) }));
    }
  };

  const endPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
  };

  useEffect(() => {
    const el = stageWrap.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!img) return;
      e.preventDefault();
      const p = toInternal(e.clientX, e.clientY);
      const k = Math.exp(-e.deltaY * 0.0016);
      setSt((s) => {
        const ns = clamp(s.s * k, 0.5, 8);
        const kk = ns / s.s;
        return { ...s, s: ns, x: p.x - (p.x - s.x) * kk, y: p.y - (p.y - s.y) * kk };
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [img]);

  const zoomBy = (k: number) =>
    setSt((s) => {
      const ns = clamp(s.s * k, 0.5, 8);
      const kk = ns / s.s;
      return { ...s, s: ns, x: s.x * kk, y: s.y * kk };
    });

  /* ---------- memuat gambar ---------- */
  const loadSrc = useCallback(
    (src: string) => {
      const im = new Image();
      im.onload = () => {
        setImg(im);
        setSt({ x: 0, y: 0, s: 1, r: 0 });
        toast("Foto naik panggung! Cubit, geser, putar sesukamu.", "ok");
      };
      im.onerror = () => toast("Hmm, file-nya nggak kebaca sebagai gambar.", "err");
      im.src = src;
    },
    [toast]
  );

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast("Itu bukan gambar, ges. Coba lagi ya.", "err");
      return;
    }
    const rd = new FileReader();
    rd.onload = () => loadSrc(String(rd.result));
    rd.readAsDataURL(f);
    e.target.value = "";
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith("image/")) {
      const rd = new FileReader();
      rd.onload = () => loadSrc(String(rd.result));
      rd.readAsDataURL(f);
    } else toast("Jatuhin file gambar ya, bukan yang lain.", "err");
  };

  const useSample = () => {
    const kind = SAMPLES[sampleIdx.current % SAMPLES.length];
    sampleIdx.current += 1;
    loadSrc(sampleImageDataURL(kind));
  };

  /* ---------- kirim ke server ---------- */
  const doSend = async () => {
    if (!img) return;
    if (!user) {
      openLogin("user");
      toast("Login dulu — server cuma nerima file dari kredensial resmi.", "info");
      return;
    }
    setSending(true);
    const { bin, thumb, full } = bakeJobImage(img, st, mode, thr, contrast / 100);
    const id = nextJobId();
    const job: PrintJob = {
      id,
      caption: caption.trim(),
      owner: user.username,
      mode,
      ts: Date.now(),
      bin,
      thumb,
      status: "antre",
    };
    let status: JobStatus = "antre";
    try {
      const ctrl = new AbortController();
      const t = window.setTimeout(() => ctrl.abort(), 2200);
      // Get session token from localStorage
      const sessionRaw = localStorage.getItem("cetakyuk-session");
      const session = sessionRaw ? JSON.parse(sessionRaw) : null;
      const authToken = session?.token || btoa(`${user.username}:${Date.now()}`);
      
      const res = await fetch(`${serverUrl}/api/print`, {
        method: "POST",
        signal: ctrl.signal,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ id, caption: job.caption, owner: job.owner, mode, dots: `${DOT_AREA}x${DOT_AREA}`, image: full, thumb }),
      });
      window.clearTimeout(t);
      if (!res.ok) throw new Error("bad status");
      toast(`${id} terkirim ke server HP! Siap dicetak.`, "ok");
    } catch {
      status = "offline";
      toast("Server HP belum reachable — job aman di antrean lokal dulu.", "err");
    }
    addJob({ ...job, status });
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 }, colors: ["#7cc24b", "#f5873c", "#1a5c46", "#bce3ce"] });
    setSending(false);
  };

  const toolBtn = "press sticker-sm inline-flex items-center justify-center rounded-lg bg-paper p-2.5 disabled:opacity-40";

  return (
    <section id="editor" className="relative border-b-2 border-ink bg-paper">
      <div className="halftone-pine absolute inset-x-0 top-0 h-40 opacity-[0.07]" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <Reveal>
          <SectionHead
            kicker="editor demo • persis kayak di HP-mu"
            title={
              <>
                Atur posisinya, <span className="text-tang-deep">cubit</span> buat zoom,{" "}
                <span className="underline decoration-leaf decoration-[6px] underline-offset-4">tulis yang manis.</span>
              </>
            }
            sub="Output 1:1 — yang kamu lihat di layar bakal segitu juga di kertas 100×100 mm. Foto mengisi area 80×80 mm, sisanya buat catatan manismu di bawah."
          />
        </Reveal>

        <div className="grid gap-10 lg:grid-cols-[1.02fr_0.98fr]">
          {/* ==================== panggung ==================== */}
          <Reveal>
            <div
              ref={stageWrap}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endPointer}
              onPointerCancel={endPointer}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`sticker-lg relative aspect-square touch-none select-none overflow-hidden rounded-xl bg-mint transition-shadow ${
                img ? "cursor-grab active:cursor-grabbing" : ""
              } ${dragOver ? "outline-4 outline-dashed outline-tang" : ""}`}
            >
              <canvas ref={stageRef} width={SIZE} height={SIZE} className="absolute inset-0 h-full w-full" />
              <canvas
                ref={dithRef}
                className={`pixelated absolute inset-0 h-full w-full transition-opacity duration-300 ${
                  img && ditherOn ? "opacity-100" : "opacity-0"
                }`}
              />

              {/* sudut bidik */}
              {img && (
                <div className="pointer-events-none absolute inset-3 text-paper drop-shadow-[0_1px_0_rgba(0,0,0,0.6)]" aria-hidden>
                  {["left-0 top-0 border-l-4 border-t-4", "right-0 top-0 border-r-4 border-t-4", "left-0 bottom-0 border-l-4 border-b-4", "right-0 bottom-0 border-r-4 border-b-4"].map(
                    (c) => (
                      <span key={c} className={`absolute h-7 w-7 rounded-sm ${c}`} />
                    )
                  )}
                  <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1 rounded-full bg-ink/75 px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-paper">
                    1:1 • geser / cubit / scroll
                  </span>
                </div>
              )}

              {/* placeholder */}
              {!img && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
                  <span className="sticker flex h-20 w-20 items-center justify-center rounded-full bg-paper">
                    <ImageIcon size={38} className="text-pine" />
                  </span>
                  <div>
                    <p className="font-display text-2xl font-extrabold">Panggungnya masih kosong</p>
                    <p className="mt-1 text-sm font-semibold text-ink/60">
                      Pilih dari galeri, jepret langsung, atau jatuhin file ke sini
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2.5">
                    <label className="press sticker cursor-pointer rounded-full bg-leaf px-4 py-2.5 font-display text-sm font-extrabold">
                      <input type="file" accept="image/*" className="hidden" onChange={onFile} />
                      <span className="flex items-center gap-1.5">
                        <GalleryIcon size={16} /> Pilih Gambar
                      </span>
                    </label>
                    <button
                      onClick={() => setCamOpen(true)}
                      className="press sticker flex items-center gap-1.5 rounded-full bg-tang px-4 py-2.5 font-display text-sm font-extrabold"
                    >
                      <CameraIcon size={16} /> Buka Kamera
                    </button>
                    <button
                      onClick={useSample}
                      className="press sticker-sm flex items-center gap-1.5 rounded-full bg-paper px-4 py-2.5 font-display text-sm font-extrabold"
                    >
                      <SparkIcon size={15} /> Pakai Contoh
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* alat-alat */}
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <button onClick={() => zoomBy(1.25)} disabled={!img} className={toolBtn} title="Perbesar">
                <ZoomInIcon size={18} />
              </button>
              <button onClick={() => zoomBy(0.8)} disabled={!img} className={toolBtn} title="Perkecil">
                <ZoomOutIcon size={18} />
              </button>
              <button
                onClick={() => setSt((s) => ({ ...s, r: (s.r + 90) % 360 }))}
                disabled={!img}
                className={toolBtn}
                title="Putar 90°"
              >
                <RotateIcon size={18} />
              </button>
              <button onClick={() => setSt({ x: 0, y: 0, s: 1, r: 0 })} disabled={!img} className={toolBtn} title="Reset">
                <ResetIcon size={18} />
              </button>
              {img && (
                <span className="sticker-sm rounded-lg bg-pine px-3 py-2 font-mono text-[11px] font-bold text-paper">
                  zoom {Math.round(st.s * 100)}% • {st.r}°
                </span>
              )}
              <button
                onClick={() => {
                  if (img) {
                    setImg(null);
                    setCaption("");
                    toast("Panggung dikosongin. Ganti foto, yuk!", "info");
                  }
                }}
                disabled={!img}
                className={`${toolBtn} ml-auto bg-berry text-paper`}
                title="Ganti foto"
              >
                <XIcon size={16} />
              </button>
            </div>

            {/* racikan dither */}
            <div className="sticker mt-5 rounded-xl bg-cream p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="flex items-center gap-2 font-display text-sm font-extrabold uppercase tracking-wide">
                  <SparkIcon size={17} className="text-tang-deep" /> Racikan dither
                </p>
                <button
                  onClick={() => setDitherOn((v) => !v)}
                  className={`press sticker-sm flex items-center gap-2 rounded-full px-3 py-1.5 font-display text-xs font-extrabold ${
                    ditherOn ? "bg-pine text-paper" : "bg-paper"
                  }`}
                >
                  <span className={`h-2.5 w-2.5 rounded-full border border-ink ${ditherOn ? "bg-leaf" : "bg-ink/20"}`} />
                  {ditherOn ? "dither nyala" : "dither mati"}
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {MODES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={`press sticker-sm rounded-full px-3.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider ${
                      mode === m.id ? "bg-tang" : "bg-paper"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 flex justify-between font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ink/60">
                    <span>ambang batas</span>
                    <span className="text-pine">{thr}</span>
                  </span>
                  <input
                    type="range" min={60} max={200} value={thr}
                    onChange={(e) => setThr(Number(e.target.value))}
                    className="w-full accent-tang"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 flex justify-between font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ink/60">
                    <span>kontras</span>
                    <span className="text-pine">{contrast}%</span>
                  </span>
                  <input
                    type="range" min={60} max={180} value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                    className="w-full accent-pine"
                  />
                </label>
              </div>
            </div>
          </Reveal>

          {/* ==================== resi cetak ==================== */}
          <Reveal delay={120}>
            <div className="sticker-lg relative rounded-xl bg-pine p-1.5">
              <div className="paper-grain rounded-lg bg-paper p-5 sm:p-6">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-xl font-extrabold">Resi Cetak</h3>
                  <span className="sticker-sm -rotate-2 rounded-md bg-leaf px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest">
                    live preview
                  </span>
                </div>

                <div className="relative mx-auto mt-4 w-full max-w-[340px]">
                  <span className="perf-holes absolute -left-2.5 top-0 h-full w-2" style={{ backgroundSize: "8px 14px", ["--hole" as string]: "#1a5c46" }} aria-hidden />
                  <span className="perf-holes absolute -right-2.5 top-0 h-full w-2" style={{ backgroundSize: "8px 14px", ["--hole" as string]: "#1a5c46" }} aria-hidden />
                  <canvas
                    ref={labelRef}
                    width={800}
                    height={800}
                    className={`w-full rounded-sm border-2 border-ink/15 ${img ? "" : "opacity-40"}`}
                  />
                  {!img && (
                    <p className="absolute inset-0 flex items-center justify-center px-8 text-center font-hand text-2xl font-semibold text-ink/50">
                      fotomu bakal nongol di sini…
                    </p>
                  )}
                </div>

                <label className="mt-5 block">
                  <span className="mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-display text-sm font-extrabold">
                      <PenIcon size={15} className="text-tang-deep" /> Catatan manis di bawah foto
                    </span>
                    <span className={`font-mono text-[10px] font-bold ${caption.length > 80 ? "text-berry" : "text-ink/45"}`}>
                      {caption.length}/90
                    </span>
                  </span>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value.slice(0, 90))}
                    rows={2}
                    maxLength={90}
                    placeholder="cth: “jangan lupa senyum, besok pasti lebih baik ♡”"
                    className="sticker-sm w-full resize-none rounded-lg bg-cream/70 px-3.5 py-2.5 font-hand text-2xl font-semibold leading-snug outline-none placeholder:text-base placeholder:font-sans placeholder:font-medium placeholder:text-ink/35 focus:bg-mint/40"
                  />
                </label>

                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 border-y-2 border-dashed border-ink/15 py-3.5 font-mono text-[11px] font-bold text-ink/70">
                  <dt className="uppercase tracking-widest text-ink/45">media</dt>
                  <dd className="text-right">100 × 100 mm</dd>
                  <dt className="uppercase tracking-widest text-ink/45">area foto</dt>
                  <dd className="text-right">640×640 dot ≈ 80 mm</dd>
                  <dt className="uppercase tracking-widest text-ink/45">mesin</dt>
                  <dd className="text-right">Zebra GC420T • OTG</dd>
                  <dt className="uppercase tracking-widest text-ink/45">pengirim</dt>
                  <dd className="text-right">{user ? `@${user.username}` : "belum login"}</dd>
                </dl>

                <button
                  onClick={doSend}
                  disabled={!img || sending}
                  className="press sticker mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-tang py-3.5 font-display text-lg font-extrabold disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {sending ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-[3px] border-ink border-t-transparent" />
                      Ngirim ke server HP…
                    </>
                  ) : (
                    <>
                      <SendIcon size={19} /> Kirim ke Server, Cetak!
                    </>
                  )}
                </button>
                <p className="mt-2.5 flex items-center justify-center gap-1.5 text-center font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ink/50">
                  {user ? (
                    <>
                      <CheckIcon size={12} className="text-pine" /> login sbg {user.role === "super" ? "superuser" : "user reguler"}
                    </>
                  ) : (
                    <>kirim = wajib login • file dilindungi kredensial</>
                  )}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <MonoChip className="bg-mint">
                <PinchIcon size={13} className="text-pine" /> cubit = zoom di HP
              </MonoChip>
              <MonoChip className="bg-mint">scroll = zoom di laptop</MonoChip>
              <MonoChip className="bg-mint">output 1:1, nggak bakal ke-crop diam-diam</MonoChip>
            </div>
          </Reveal>
        </div>
      </div>

      {camOpen && (
        <CameraModal
          onClose={() => setCamOpen(false)}
          onCapture={(src) => {
            setCamOpen(false);
            loadSrc(src);
          }}
          onError={(m) => toast(m, "err")}
        />
      )}
    </section>
  );
}

/* ==================== modal kamera ==================== */
function CameraModal({
  onClose,
  onCapture,
  onError,
}: {
  onClose: () => void;
  onCapture: (src: string) => void;
  onError: (msg: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stopped = false;
    (async () => {
      try {
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }
        if (stopped) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
          setReady(true);
        }
      } catch {
        onError("Kamera nggak bisa dibuka — izinnya ditolak atau nggak ada kamera.");
        onClose();
      }
    })();
    return () => {
      stopped = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [onClose, onError]);

  const capture = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const side = Math.min(v.videoWidth, v.videoHeight);
    const c = makeCanvas(1080);
    const ctx = c.getContext("2d")!;
    ctx.drawImage(v, (v.videoWidth - side) / 2, (v.videoHeight - side) / 2, side, side, 0, 0, 1080, 1080);
    onCapture(c.toDataURL("image/jpeg", 0.92));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal>
      <button aria-label="Tutup" className="absolute inset-0 bg-pine-deep/75" onClick={onClose} />
      <div className="sticker-lg anim-pop relative w-full max-w-md rounded-xl bg-paper p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-display text-lg font-extrabold">
            <CameraIcon size={20} className="text-tang-deep" /> Kamera HP-mu
          </h3>
          <button onClick={onClose} className="press sticker-sm rounded-full bg-tang p-1.5" aria-label="Tutup kamera">
            <XIcon size={14} />
          </button>
        </div>
        <div className="sticker relative aspect-square overflow-hidden rounded-lg bg-ink">
          <video ref={videoRef} playsInline muted className={`h-full w-full object-cover ${ready ? "" : "opacity-0"}`} />
          {!ready && (
            <p className="absolute inset-0 flex items-center justify-center font-mono text-xs font-bold uppercase tracking-widest text-paper">
              nyalain kamera…
            </p>
          )}
          <span className="pointer-events-none absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-paper/80" />
        </div>
        <button
          onClick={capture}
          disabled={!ready}
          className="press sticker mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-leaf py-3 font-display text-base font-extrabold disabled:opacity-45"
        >
          <CameraIcon size={19} /> Jepret!
        </button>
      </div>
    </div>
  );
}
