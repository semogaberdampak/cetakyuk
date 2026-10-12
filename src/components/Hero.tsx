import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { useApp } from "../state";
import { ArrowDownIcon, ArrowRightIcon, BoltIcon, CameraIcon, PinchIcon, PrinterIcon, QrIcon, SparkIcon, StarIcon } from "./Icons";
import { MonoChip, Reveal, StatusDot } from "./ui";

const WORDS = ["momen receh", "gaya random", "senyum tipis", "pose paling norak", "muka bantal"];

export default function Hero() {
  const { serverUrl, setServerUrl } = useApp();
  const [wi, setWi] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => setWi((i) => (i + 1) % WORDS.length), 2400);
    return () => window.clearInterval(t);
  }, []);

  return (
    <section id="atas" className="relative overflow-hidden border-b-2 border-ink bg-cream">
      <div className="grid-soft absolute inset-0" aria-hidden />
      <div className="halftone-pine absolute -right-20 -top-24 h-96 w-96 rounded-full opacity-20" aria-hidden />
      <div className="halftone absolute -bottom-24 -left-16 h-80 w-80 rounded-full opacity-15" aria-hidden />

      <div className="relative mx-auto grid max-w-6xl gap-12 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:pb-24 lg:pt-16">
        {/* ------- kiri: teriakan kiosk ------- */}
        <div>
          <Reveal>
            <MonoChip className="bg-paper">
              <StatusDot tone="ok" /> kiosk cetak mandiri • server = HP Android
            </MonoChip>
          </Reveal>

          <h1 className="mt-6 font-display font-extrabold leading-[0.95] tracking-tight">
            <span className="block text-[clamp(2.05rem,7.2vw,5.4rem)]">SCAN. JEPRET.</span>
            <span className="my-3 block">
              <span
                key={wi}
                className="anim-word sticker-lg inline-block -rotate-2 rounded-xl bg-tang px-4 py-1 text-[clamp(1.4rem,4.6vw,3.4rem)]"
              >
                {WORDS[wi]}
              </span>
            </span>
            <span className="text-outline block text-[clamp(2.05rem,7.2vw,5.4rem)]">TERUS CETAK!</span>
          </h1>

          <Reveal delay={120}>
            <p className="mt-6 max-w-xl text-base font-semibold leading-relaxed text-ink/75 sm:text-lg">
              Foto di HP-mu jadi label <b className="text-pine">100×100 mm</b> dalam ±40 detik. Atur posisi,{" "}
              <b>cubit buat zoom</b>, tulis pesan manis — server HP Android mendither fotomu jadi 1-bit ala koran jadul,
              lalu <b>Zebra GC420T</b> mencetaknya lewat USB OTG. Tanpa PC, tanpa ribet.
            </p>
          </Reveal>

          <Reveal delay={200}>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href="#editor"
                className="press sticker inline-flex items-center gap-2 rounded-full bg-tang px-6 py-3 font-display text-base font-extrabold"
              >
                <PinchIcon size={19} /> Coba Editornya <ArrowRightIcon size={17} />
              </a>
              <a
                href="#cara"
                className="press sticker inline-flex items-center gap-2 rounded-full bg-paper px-6 py-3 font-display text-base font-extrabold"
              >
                Cara Kerjanya <ArrowDownIcon size={16} />
              </a>
            </div>
          </Reveal>

          <Reveal delay={280}>
            <div className="mt-8 flex flex-wrap gap-2.5">
              <MonoChip>
                <QrIcon size={13} className="text-tang-deep" /> scan via QR
              </MonoChip>
              <MonoChip>
                <CameraIcon size={13} className="text-pine" /> galeri / kamera HP
              </MonoChip>
              <MonoChip>
                <SparkIcon size={13} className="text-tang-deep" /> dither 1-bit floyd–steinberg
              </MonoChip>
              <MonoChip>
                <PrinterIcon size={13} className="text-pine" /> 640×640 dot • 8 dot/mm
              </MonoChip>
              <MonoChip>
                <BoltIcon size={13} className="text-tang-deep" /> ±40 dtk / label
              </MonoChip>
            </div>
          </Reveal>
        </div>

        {/* ------- kanan: kertas QR keluar dari printer ------- */}
        <Reveal delay={150} className="relative mx-auto w-full max-w-[400px]">
          <div className="anim-bob absolute -left-5 top-16 z-20" style={{ ["--rot" as string]: "-9deg" }}>
            <span className="sticker-sm inline-block rotate-[-9deg] rounded-md bg-leaf px-3 py-1.5 font-display text-sm font-extrabold">
              GRATIS*
            </span>
          </div>
          <div className="anim-bob absolute -right-4 bottom-24 z-20" style={{ animationDelay: "0.8s" }}>
            <span className="sticker-sm inline-block rotate-6 rounded-md bg-tang px-3 py-1.5 font-display text-sm font-extrabold">
              output 1:1
            </span>
          </div>
          <span className="anim-spin-slow absolute -right-8 top-2 text-tang" aria-hidden>
            <StarIcon size={44} />
          </span>

          {/* kepala printer */}
          <div className="sticker-lg relative z-10 rounded-t-2xl bg-pine px-6 pb-4 pt-5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-mint">
                Zebra GC420T • 203 dpi
              </span>
              <span className="flex gap-1.5">
                <span className="anim-blink h-2.5 w-2.5 rounded-full bg-leaf" />
                <span className="h-2.5 w-2.5 rounded-full bg-tang" />
              </span>
            </div>
            <div className="mt-3 h-3 rounded-full bg-pine-deep shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]" />
          </div>
          <div className="perf-holes relative z-10 -mt-px bg-mint" style={{ ["--hole" as string]: "#123f30" }} />

          {/* kertas QR */}
          <div className="paper-grain sticker-lg relative z-0 -mt-px rounded-b-lg bg-paper px-6 pb-6 pt-5">
            <p className="text-center font-display text-lg font-extrabold">
              Arahkan kamera HP ke sini <span className="inline-block -rotate-6">👇</span>
            </p>
            <p className="mt-0.5 text-center font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-ink/50">
              kebuka halaman upload di HP-mu
            </p>
            <div className="sticker mx-auto mt-4 w-fit rotate-1 rounded-xl bg-cream p-4 transition-transform duration-300 hover:rotate-0 hover:scale-[1.03]">
              <QRCode value={`${serverUrl}/upload`} size={176} bgColor="#f2e8cf" fgColor="#123f30" level="M" />
            </div>

            <label className="mt-5 block">
              <span className="mb-1 flex items-center justify-between font-mono text-[9.5px] font-bold uppercase tracking-[0.18em] text-ink/50">
                <span>alamat server (IP HP Android)</span>
                <span className="text-pine">QR ikut berubah</span>
              </span>
              <input
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                spellCheck={false}
                className="sticker-sm w-full rounded-lg bg-paper px-3 py-2 font-mono text-xs font-bold text-pine outline-none focus:bg-mint/40"
              />
            </label>

            <div className="mt-4 flex items-center justify-center gap-2 border-t-2 border-dashed border-ink/15 pt-3.5">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/45">
                {serverUrl}/upload • tanpa app, cuma browser
              </span>
            </div>
          </div>

          <p className="mt-4 text-center font-hand text-2xl font-semibold text-pine">
            *selama kertas &amp; ribbon masih ada, ya!
          </p>
        </Reveal>
      </div>
    </section>
  );
}
