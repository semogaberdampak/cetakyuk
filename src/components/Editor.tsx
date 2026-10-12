import { useCallback, useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import confetti from "canvas-confetti";
import { drawScene, makeCanvas, grayFromCanvas, applyContrast, dither1bit, blit1bit, type DitherMode, type SceneState } from "../lib/dither";
import { bakeJobImage, nextJobId, sampleImageDataURL, DOT_AREA, type JobStatus, type PrintJob } from "../lib/printjob";
import { useApp } from "../state";
import {
  CameraIcon, GalleryIcon, ImageIcon, PinchIcon, RotateIcon, ResetIcon, SendIcon, SparkIcon,
  ZoomInIcon, ZoomOutIcon, PenIcon, XIcon, CheckIcon, EyeIcon, EyeOffIcon, SlidersIcon,
} from "./Icons";
import { MonoChip, Reveal, SectionHead } from "./ui";

/* Internal render resolution (higher = sharper dither, lower = faster) */
const RENDER_SIZE = 512;
const LABEL_DOT_SIZE = 640;
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
  const [showSplit, setShowSplit] = useState(false);
  const [showLabelPreview, setShowLabelPreview] = useState(true);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const sampleIdx = useRef(0);

  const stageWrap = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLCanvasElement>(null);
  const dithRef = useRef<HTMLCanvasElement>(null);
  const labelRef = useRef<HTMLCanvasElement>(null);
  const originalRef = useRef<HTMLCanvasElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; mid: { x: number; y: number } } | null>(null);

  /* ---- Responsive stage sizing ---- */
  const [stageSize, setStageSize] = useState(0);
  useEffect(() => {
    const updateSize = () => {
      if (!stageWrap.current) return;
      const rect = stageWrap.current.getBoundingClientRect();
      setStageSize(Math.floor(rect.width));
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(stageWrap.current!);
    window.addEventListener("resize", updateSize);
    return () => { ro.disconnect(); window.removeEventListener("resize", updateSize); };
  }, []);

  /* redraw stage (original) at internal resolution */
  useEffect(() => {
    const c = stageRef.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    c.width = RENDER_SIZE;
    c.height = RENDER_SIZE;
    if (!img) { ctx.clearRect(0, 0, RENDER_SIZE, RENDER_SIZE); return; }
    drawScene(ctx, img, st, RENDER_SIZE);
    if (originalRef.current) {
      const octx = originalRef.current.getContext("2d")!;
      originalRef.current.width = RENDER_SIZE;
      originalRef.current.height = RENDER_SIZE;
      drawScene(octx, img, st, RENDER_SIZE);
    }
  }, [img, st, stageSize]);

  /* dither at internal resolution */
  useEffect(() => {
    if (!img) return;
    const t = window.setTimeout(() => {
      const c = makeCanvas(RENDER_SIZE);
      drawScene(c.getContext("2d")!, img, st, RENDER_SIZE);
      const bin = dither1bit(applyContrast(grayFromCanvas(c), contrast / 100), RENDER_SIZE, RENDER_SIZE, mode, thr);
      if (dithRef.current) {
        dithRef.current.width = RENDER_SIZE;
        dithRef.current.height = RENDER_SIZE;
        blit1bit(dithRef.current, bin, RENDER_SIZE, RENDER_SIZE);
      }
    }, 30);
    return () => window.clearTimeout(t);
  }, [img, st, mode, thr, contrast]);

  /* label preview at 1:1 (640x640 dots) */
  useEffect(() => {
    if (!img || !showLabelPreview) return;
    const t = window.setTimeout(() => {
      const lc = labelRef.current;
      if (!lc) return;
      const photo = makeCanvas(LABEL_DOT_SIZE);
      drawScene(photo.getContext("2d")!, img, st, LABEL_DOT_SIZE);
      const bin = dither1bit(applyContrast(grayFromCanvas(photo), contrast / 100), LABEL_DOT_SIZE, LABEL_DOT_SIZE, mode, thr);
      const p2 = makeCanvas(LABEL_DOT_SIZE);
      blit1bit(p2, bin, LABEL_DOT_SIZE, LABEL_DOT_SIZE);

      // Render label at 800x800 (full label with margins)
      lc.width = 800;
      lc.height = 800;
      const ctx = lc.getContext("2d")!;
      ctx.fillStyle = "#fdfaf1";
      ctx.fillRect(0, 0, 800, 800);
      ctx.drawImage(p2, 80, 24, LABEL_DOT_SIZE, LABEL_DOT_SIZE);
      ctx.strokeStyle = "#1e2b22";
      ctx.lineWidth = 4;
      ctx.strokeRect(80, 24, LABEL_DOT_SIZE, LABEL_DOT_SIZE);
      ctx.fillStyle = "#18211b";
      ctx.textAlign = "center";
      const text = caption.trim() || "…tuliskan sesuatu yang manis…";
      ctx.globalAlpha = caption.trim() ? 1 : 0.35;
      ctx.font = "600 46px Caveat, cursive";
      ctx.fillText(text, 400, 728, 720);
      ctx.globalAlpha = 1;
      ctx.font = "700 21px 'Space Mono', monospace";
      ctx.fillText(`CETAKYUK! • 100×100 MM • 8 DOT/MM`, 400, 772);
    }, 50);
    return () => window.clearTimeout(t);
  }, [img, st, mode, thr, contrast, caption, fontTick, showLabelPreview]);

  useEffect(() => {
    let alive = true;
    document.fonts?.ready.then(() => alive && setFontTick((v) => v + 1));
    return () => { alive = false; };
  }, []);

  /* ---------- Interactions ---------- */
  const toInternal = useCallback((clientX: number, clientY: number) => {
    const wrap = stageWrap.current;
    if (!wrap) return { x: 0, y: 0, k: 1 };
    const rect = wrap.getBoundingClientRect();
    const k = RENDER_SIZE / rect.width;
    return { x: (clientX - rect.left - rect.width / 2) * k, y: (clientY - rect.top - rect.height / 2) * k, k };
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!img) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setIsAdjusting(true);
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
    if (pointers.current.size === 0) setIsAdjusting(false);
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
      setIsAdjusting(true);
      setTimeout(() => setIsAdjusting(false), 100);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [img, toInternal]);

  const zoomBy = (k: number) =>
    setSt((s) => {
      const ns = clamp(s.s * k, 0.5, 8);
      const kk = ns / s.s;
      return { ...s, s: ns, x: s.x * kk, y: s.y * kk };
    });

  /* ---------- Image loading ---------- */
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
    if (!f.type.startsWith("image/")) { toast("Itu bukan gambar, ges. Coba lagi ya.", "err"); return; }
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

  /* ---------- Send to server ---------- */
  const doSend = async () => {
    if (!img) return;
    if (!user) { openLogin("user"); toast("Login dulu — server cuma nerima file dari kredensial resmi.", "info"); return; }
    setSending(true);
    const { bin, thumb, full } = bakeJobImage(img, st, mode, thr, contrast / 100);
    const id = nextJobId();
    const job: PrintJob = { id, caption: caption.trim(), owner: user.username, mode, ts: Date.now(), bin, thumb, status: "antre" };
    let status: JobStatus = "antre";
    try {
      const ctrl = new AbortController();
      const t = window.setTimeout(() => ctrl.abort(), 2200);
      const sessionRaw = localStorage.getItem("cetakyuk-session");
      const session = sessionRaw ? JSON.parse(sessionRaw) : null;
      const authToken = session?.token || btoa(`${user.username}:${Date.now()}`);
      const res = await fetch(`${serverUrl}/api/print`, {
        method: "POST", signal: ctrl.signal,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ id, caption: job.caption, owner: job.owner, mode, dots: `${DOT_AREA}x${DOT_AREA}`, image: full, thumb }),
      });
      window.clearTimeout(t);
      if (!res.ok) throw new Error("bad status");
      toast(`${id} terkirim ke server HP! Siap dicetak.`, "ok");
    } catch { status = "offline"; toast("Server HP belum reachable — job aman di antrean lokal dulu.", "err"); }
    addJob({ ...job, status });
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 }, colors: ["#7cc24b", "#f5873c", "#1a5c46", "#bce3ce"] });
    setSending(false);
  };

  const toolBtn = "press sticker-sm inline-flex items-center justify-center rounded-lg bg-paper p-2.5 disabled:opacity-40 transition-all min-h-[44px] min-w-[44px]";

  return (
    <section id="editor" className="relative border-b-2 border-ink bg-paper">
      <div className="halftone-pine absolute inset-x-0 top-0 h-40 opacity-[0.07]" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
        <Reveal>
          <SectionHead
            kicker="editor kiosk • live preview realtime"
            title={
              <>
                Atur posisinya, <span className="text-tang-deep">cubit</span> buat zoom,{" "}
                <span className="underline decoration-leaf decoration-[6px] underline-offset-4">tulis yang manis.</span>
              </>
            }
            sub="Drag / pinch / scroll = geser & zoom. Semua perubahan langsung nongol di preview label. Output 1:1 persis sama cetakan."
          />
        </Reveal>

        {/* Mobile: Stacked layout. Desktop: Side-by-side */}
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {/* ==================== PANEL KIRI: STAGE ==================== */}
          <Reveal className="min-w-0">
            <div className="space-y-5">
              {/* --- Stage Area --- */}
              <div className="relative">
                <div
                  ref={stageWrap}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={endPointer}
                  onPointerLeave={endPointer}
                  onPointerCancel={endPointer}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  className={`sticker-lg relative aspect-square touch-none select-none overflow-hidden rounded-2xl bg-mint transition-all duration-200 ${
                    img ? "cursor-grab active:cursor-grabbing" : ""
                  } ${dragOver ? "outline-4 outline-dashed outline-tang scale-[1.005]" : ""} ${
                    isAdjusting ? "ring-4 ring-tang/50" : ""
                  }`}
                  style={{ boxShadow: isAdjusting ? "0 0 0 4px #f5873c40, 8px 8px 0 0 #1e2b22" : "8px 8px 0 0 #1e2b22" }}
                >
                  {/* Split View or Single View */}
                  <div className="absolute inset-0" style={{ overflow: "hidden" }}>
                    {/* Original (left in split) or full */}
                    <div className={`${showSplit ? "w-1/2" : "w-full"} h-full relative`}>
                      <canvas
                        ref={originalRef}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      {showSplit && (
                        <div className="absolute inset-0 flex items-center justify-center bg-ink/5 pointer-events-none">
                          <span className="sticker-sm rounded-full bg-pine px-3 py-1 font-mono text-[10px] font-bold text-paper">ORIGINAL</span>
                        </div>
                      )}
                    </div>

                    {/* Dithered (right in split) */}
                    {showSplit && (
                      <div className="w-1/2 h-full relative border-l-2 border-ink/20">
                        <canvas ref={dithRef} className={`pixelated absolute inset-0 h-full w-full transition-opacity duration-200 ${img && ditherOn ? "opacity-100" : "opacity-0"}`} />
                        <div className="absolute inset-0 flex items-center justify-center bg-ink/5 pointer-events-none">
                          <span className="sticker-sm rounded-full bg-tang px-3 py-1 font-mono text-[10px] font-bold text-ink">DITHERED</span>
                        </div>
                      </div>
                    )}

                    {/* Single: overlay dithered */}
                    {!showSplit && img && ditherOn && (
                      <canvas ref={dithRef} className="pixelated absolute inset-0 h-full w-full transition-opacity duration-200 opacity-100" />
                    )}

                    {/* Corner guides */}
                    {img && (
                      <div className="pointer-events-none absolute inset-3 text-paper drop-shadow-[0_1px_0_rgba(0,0,0,0.6)]" aria-hidden>
                        {["left-0 top-0 border-l-4 border-t-4", "right-0 top-0 border-r-4 border-t-4", "left-0 bottom-0 border-l-4 border-b-4", "right-0 bottom-0 border-r-4 border-b-4"].map(
                          (c) => <span key={c} className={`absolute h-8 w-8 rounded-sm ${c} transition-opacity ${isAdjusting ? "opacity-100" : "opacity-60"}`} />
                        )}
                        <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1 rounded-full bg-ink/75 px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-paper">
                          {isAdjusting ? "Mengatur..." : "Geser / Cubit / Scroll"}
                        </span>
                        {isAdjusting && (
                          <span className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1 rounded-full bg-tang px-3 py-1 font-mono text-[10px] font-bold text-ink">
                            Zoom {Math.round(st.s * 100)}% • {st.r}°
                          </span>
                        )}
                      </div>
                    )}

                    {/* Placeholder */}
                    {!img && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
                        <span className="sticker flex h-24 w-24 items-center justify-center rounded-full bg-paper anim-bob">
                          <ImageIcon size={44} className="text-pine" />
                        </span>
                        <div>
                          <p className="font-display text-2xl font-extrabold">Panggungnya masih kosong</p>
                          <p className="mt-1 text-sm font-semibold text-ink/60">Pilih dari galeri, jepret langsung, atau jatuhin file ke sini</p>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-2.5">
                          <label className="press sticker cursor-pointer rounded-full bg-leaf px-4 py-2.5 font-display text-sm font-extrabold min-h-[44px]">
                            <input type="file" accept="image/*" className="hidden" onChange={onFile} />
                            <span className="flex items-center gap-1.5"><GalleryIcon size={16} /> Pilih Gambar</span>
                          </label>
                          <button onClick={() => setCamOpen(true)} className="press sticker flex items-center gap-1.5 rounded-full bg-tang px-4 py-2.5 font-display text-sm font-extrabold min-h-[44px]">
                            <CameraIcon size={16} /> Buka Kamera
                          </button>
                          <button onClick={useSample} className="press sticker-sm flex items-center gap-1.5 rounded-full bg-paper px-4 py-2.5 font-display text-sm font-extrabold min-h-[44px]">
                            <SparkIcon size={15} /> Pakai Contoh
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Drop zone overlay */}
                    {dragOver && !img && (
                      <div className="absolute inset-0 flex items-center justify-center bg-tang/10 outline-4 outline-dashed outline-tang rounded-2xl anim-pop">
                        <p className="font-display text-xl font-extrabold text-tang">Lepas di sini!</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Toolbar */}
                {img && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button onClick={() => zoomBy(1.25)} className={toolBtn} title="Perbesar" aria-label="Zoom in"><ZoomInIcon size={18} /></button>
                      <button onClick={() => zoomBy(0.8)} className={toolBtn} title="Perkecil" aria-label="Zoom out"><ZoomOutIcon size={18} /></button>
                      <button onClick={() => setSt((s) => ({ ...s, r: (s.r + 90) % 360 }))} className={toolBtn} title="Putar 90°" aria-label="Rotate 90°"><RotateIcon size={18} /></button>
                      <button onClick={() => setSt({ x: 0, y: 0, s: 1, r: 0 })} className={toolBtn} title="Reset" aria-label="Reset"><ResetIcon size={18} /></button>
                      <span className="sticker-sm rounded-lg bg-pine px-3 py-2 font-mono text-[11px] font-bold text-paper hidden sm:inline-flex">
                        Zoom {Math.round(st.s * 100)}% • {st.r}°
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowSplit((v) => !v)}
                        className={`press sticker-sm flex items-center gap-2 rounded-full px-3 py-1.5 font-display text-xs font-extrabold transition-all min-h-[44px] ${
                          showSplit ? "bg-tang text-ink" : "bg-paper"
                        }`}
                        title="Split view"
                        aria-label="Toggle split view"
                      >
                        {showSplit ? <EyeIcon size={14} /> : <EyeOffIcon size={14} />}
                        <span className="hidden sm:inline">{showSplit ? "Gabungkan" : "Split View"}</span>
                      </button>
                      <button
                        onClick={() => setShowLabelPreview((v) => !v)}
                        className={`press sticker-sm flex items-center gap-2 rounded-full px-3 py-1.5 font-display text-xs font-extrabold transition-all min-h-[44px] ${
                          showLabelPreview ? "bg-leaf" : "bg-paper"
                        }`}
                        title="Toggle label preview"
                        aria-label="Toggle label preview"
                      >
                        <SlidersIcon size={14} />
                        <span className="hidden sm:inline">{showLabelPreview ? "Sembunyikan" : "Tampilkan"} Preview</span>
                      </button>
                    </div>

                    <button
                      onClick={() => { setImg(null); setCaption(""); toast("Panggung dikosongin. Ganti foto, yuk!", "info"); }}
                      className={`${toolBtn} ml-auto bg-berry text-paper`}
                      title="Ganti foto"
                      aria-label="Clear"
                    >
                      <XIcon size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* --- Dither Controls --- */}
              <div className="sticker rounded-xl bg-cream p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="flex items-center gap-2 font-display text-sm font-extrabold uppercase tracking-wide">
                    <SparkIcon size={17} className="text-tang-deep" /> Racikan Dither
                  </p>
                  <button
                    onClick={() => setDitherOn((v) => !v)}
                    className={`press sticker-sm flex items-center gap-2 rounded-full px-3 py-1.5 font-display text-xs font-extrabold min-h-[44px] ${
                      ditherOn ? "bg-pine text-paper" : "bg-paper"
                    }`}
                  >
                    <span className={`h-2.5 w-2.5 rounded-full border border-ink ${ditherOn ? "bg-leaf" : "bg-ink/20"}`} />
                    {ditherOn ? "Dither Nyala" : "Dither Mati"}
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {MODES.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMode(m.id)}
                      className={`press sticker-sm rounded-full px-3.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider transition-all min-h-[44px] ${
                        mode === m.id ? "bg-tang text-ink shadow-sticker-sm" : "bg-paper hover:bg-cream"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 flex justify-between font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ink/60">
                      <span>Ambang Batas</span>
                      <span className="text-pine">{thr}</span>
                    </span>
                    <input type="range" min={60} max={200} value={thr} onChange={(e) => setThr(Number(e.target.value))} className="w-full accent-tang h-3" aria-label="Threshold" />
                  </label>
                  <label className="block">
                    <span className="mb-1 flex justify-between font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ink/60">
                      <span>Kontras</span>
                      <span className="text-pine">{contrast}%</span>
                    </span>
                    <input type="range" min={60} max={180} value={contrast} onChange={(e) => setContrast(Number(e.target.value))} className="w-full accent-pine h-3" aria-label="Contrast" />
                  </label>
                </div>
              </div>
            </div>
          </Reveal>

          {/* ==================== PANEL KANAN: LIVE LABEL PREVIEW ==================== */}
          {showLabelPreview && (
            <Reveal delay={100} className="lg:sticky lg:top-24 lg:self-start">
              <div className="sticker-lg relative rounded-xl bg-pine p-1.5">
                <div className="paper-grain rounded-lg bg-paper p-5 sm:p-6 flex flex-col">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display text-xl font-extrabold">Preview Label 1:1</h3>
                    <span className="sticker-sm -rotate-2 rounded-md bg-leaf px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest">Live</span>
                  </div>

                  <div className="relative flex-1 flex items-center justify-center mt-4 min-h-[320px]">
                    <div className="relative w-full max-w-[360px]">
                      <span className="perf-holes absolute -left-3 top-0 h-full w-2.5" style={{ backgroundSize: "10px 16px", ["--hole" as string]: "#1a5c46" }} aria-hidden />
                      <span className="perf-holes absolute -right-3 top-0 h-full w-2.5" style={{ backgroundSize: "10px 16px", ["--hole" as string]: "#1a5c46" }} aria-hidden />
                      <canvas
                        ref={labelRef}
                        width={800}
                        height={800}
                        className={`w-full rounded-sm border-2 border-ink/15 ${img ? "shadow-sticker-lg" : "opacity-40"} transition-all duration-300`}
                      />
                      {!img && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                          <ImageIcon size={48} className="text-ink/20" />
                          <p className="mt-3 font-hand text-xl font-semibold text-ink/40">Foto & preview muncul di sini</p>
                          <p className="mt-1 font-mono text-[10px] font-bold uppercase tracking-widest text-ink/30">Geser, cubit, atur dither — lihat perubahan realtime</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Caption */}
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
                      className="sticker-sm w-full resize-none rounded-lg bg-cream/70 px-3.5 py-3 font-hand text-2xl font-semibold leading-snug outline-none placeholder:text-base placeholder:font-sans placeholder:font-medium placeholder:text-ink/35 focus:bg-mint/40 min-h-[44px]"
                    />
                  </label>

                  {/* Specs */}
                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 border-y-2 border-dashed border-ink/15 py-3.5 font-mono text-[11px] font-bold text-ink/70">
                    <dt className="uppercase tracking-widest text-ink/45">Media</dt>
                    <dd className="text-right">100 × 100 mm</dd>
                    <dt className="uppercase tracking-widest text-ink/45">Area Foto</dt>
                    <dd className="text-right">640×640 dot ≈ 80 mm</dd>
                    <dt className="uppercase tracking-widest text-ink/45">Mesin</dt>
                    <dd className="text-right">Zebra GC420T • OTG</dd>
                    <dt className="uppercase tracking-widest text-ink/45">Pengirim</dt>
                    <dd className="text-right">{user ? `@${user.username}` : "Belum login"}</dd>
                  </dl>

                  {/* Send Button */}
                  <button
                    onClick={doSend}
                    disabled={!img || sending}
                    className="press sticker mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-tang py-4 font-display text-lg font-extrabold disabled:cursor-not-allowed disabled:opacity-45 transition-all hover:scale-[1.01] active:scale-[0.99] min-h-[52px]"
                  >
                    {sending ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-[3px] border-ink border-t-transparent" />
                        Mengirim ke Server HP…
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
                        <CheckIcon size={12} className="text-pine" /> Login sbg {user.role === "super" ? "Superuser" : "User Reguler"}
                      </>
                    ) : (
                      <>Kirim = wajib login • File dilindungi kredensial</>
                    )}
                  </p>

                  {/* Quick Tips */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <MonoChip className="bg-mint"><PinchIcon size={13} className="text-pine" /> Cubit = Zoom di HP</MonoChip>
                    <MonoChip className="bg-mint">Scroll = Zoom di Laptop</MonoChip>
                    <MonoChip className="bg-mint">Output 1:1, nggak ke-crop</MonoChip>
                    <MonoChip className="bg-mint"><SlidersIcon size={13} className="text-pine" /> Split view bandingkan</MonoChip>
                  </div>
                </div>
              </div>
            </Reveal>
          )}

          {/* Compact when preview hidden */}
          {!showLabelPreview && img && (
            <Reveal delay={100}>
              <div className="sticker-lg rounded-xl bg-pine p-4 text-paper">
                <p className="font-display text-lg font-extrabold mb-3 flex items-center gap-2">
                  <CheckIcon size={20} className="text-leaf" /> Siap Kirim
                </p>
                <p className="font-hand text-xl font-semibold text-ink/80 mb-4">"{caption || "…tuliskan sesuatu yang manis…"}"</p>
                <button onClick={doSend} disabled={sending} className="press sticker w-full rounded-xl bg-tang py-3 font-display text-base font-extrabold text-ink disabled:opacity-45 min-h-[52px]">
                  {sending ? "Mengirim…" : <><SendIcon size={18} className="inline" /> Kirim ke Server, Cetak!</>}
                </button>
                <button onClick={() => setShowLabelPreview(true)} className="press sticker mt-2 w-full rounded-xl bg-pine-deep py-2 font-display text-sm font-extrabold text-mint min-h-[44px]">
                  <EyeIcon size={14} className="inline" /> Tampilkan Preview Label
                </button>
              </div>
            </Reveal>
          )}
        </div>
      </div>

      {camOpen && (
        <CameraModal
          onClose={() => setCamOpen(false)}
          onCapture={(src) => { setCamOpen(false); loadSrc(src); }}
          onError={(m) => toast(m, "err")}
        />
      )}
    </section>
  );
}

/* ==================== Camera Modal ==================== */
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
        if (stopped) { stream.getTracks().forEach((t) => t.stop()); return; }
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
    return () => { stopped = true; streamRef.current?.getTracks().forEach((t) => t.stop()); };
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
          <button onClick={onClose} className="press sticker-sm rounded-full bg-tang p-1.5 min-h-[44px] min-w-[44px]" aria-label="Tutup kamera"><XIcon size={14} /></button>
        </div>
        <div className="sticker relative aspect-square overflow-hidden rounded-lg bg-ink">
          <video ref={videoRef} playsInline muted className={`h-full w-full object-cover ${ready ? "" : "opacity-0"}`} />
          {!ready && <p className="absolute inset-0 flex items-center justify-center font-mono text-xs font-bold uppercase tracking-widest text-paper">Nyalain kamera…</p>}
          <span className="pointer-events-none absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-paper/80" />
        </div>
        <button onClick={capture} disabled={!ready} className="press sticker mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-leaf py-3 font-display text-base font-extrabold disabled:opacity-45 min-h-[48px]">
          <CameraIcon size={19} /> Jepret!
        </button>
      </div>
    </div>
  );
}