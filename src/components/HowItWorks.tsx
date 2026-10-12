import type { ReactNode } from "react";
import { Reveal, SectionHead } from "./ui";
import { QrIcon, CameraIcon, PinchIcon, PenIcon, SparkIcon, PrinterIcon, UsbIcon, LockIcon } from "./Icons";

interface Step {
  n: string;
  title: string;
  desc: string;
  icon: ReactNode;
  bg: string;
  tag: string;
}

const STEPS: Step[] = [
  {
    n: "01",
    title: "Scan QR di kiosk",
    desc: "Nggak usah install apa pun. QR-nya ngebuka halaman upload langsung di browser HP-mu lewat hotspot si HP Android server.",
    icon: <QrIcon size={26} />,
    bg: "bg-leaf",
    tag: "±3 detik",
  },
  {
    n: "02",
    title: "Pilih gambar atau jepret",
    desc: "Bebas: comot dari galeri atau buka kamera langsung dari halaman yang sama. File-nya cuma jalan di jaringan lokal — nggak ke internet.",
    icon: <CameraIcon size={26} />,
    bg: "bg-tang",
    tag: "galeri / kamera",
  },
  {
    n: "03",
    title: "Atur posisi se-estetik mungkin",
    desc: "Geser-geser, cubit buat zoom in/out, putar kalau miring. Output 1:1 — apa yang kamu lihat, persis segitu yang kepotong di kertas.",
    icon: <PinchIcon size={26} />,
    bg: "bg-mint",
    tag: "pinch to zoom",
  },
  {
    n: "04",
    title: "Tulis pesan pemanis",
    desc: "Di bawah foto ada ruang buat catatan pribadi: ucapan, tanggal jadian, quotes receh, atau “semangat skripsi!” — ke-print bareng fotonya.",
    icon: <PenIcon size={26} />,
    bg: "bg-leaf",
    tag: "90 karakter",
  },
  {
    n: "05",
    title: "Login, kirim, didither server",
    desc: "File cuma diterima lewat kredensial login. Server HP Android mengubahnya jadi bitmap 1-bit 640×640 dot dengan dither Floyd–Steinberg.",
    icon: <SparkIcon size={26} />,
    bg: "bg-tang",
    tag: "floyd–steinberg",
  },
  {
    n: "06",
    title: "GC420T langsung cetak",
    desc: "Perintah ZPL mengalir lewat USB OTG ke Zebra GC420T. Kertas 100×100 mm keluar hangat-hangat. Ambil, tempel, pamerkan.",
    icon: <PrinterIcon size={26} />,
    bg: "bg-mint",
    tag: "±40 detik",
  },
];

export default function HowItWorks() {
  return (
    <section id="cara" className="relative overflow-hidden border-b-2 border-ink bg-mint/60">
      <div className="halftone-pine absolute inset-0 opacity-[0.08]" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <Reveal>
          <SectionHead
            kicker="alur kiosk"
            title={
              <>
                Dari jempol ke kertas, <span className="text-outline">enam langkah.</span>
              </>
            }
            sub="Semuanya terjadi di jaringan lokal antara HP-mu dan HP server. Nggak ada cloud, nggak ada akun aneh-aneh."
          />
        </Reveal>

        <div className="relative">
          {/* garis sambung */}
          <svg
            className="pointer-events-none absolute left-1/2 top-0 hidden h-full w-[120px] -translate-x-1/2 text-pine/50 lg:block"
            aria-hidden
          >
            <line x1="60" y1="0" x2="60" y2="100%" stroke="currentColor" strokeWidth="3" className="anim-dash" />
          </svg>

          <ol className="space-y-6 lg:space-y-0">
            {STEPS.map((s, i) => {
              const left = i % 2 === 0;
              return (
                <li key={s.n} className="relative lg:grid lg:grid-cols-2 lg:gap-16 lg:py-5">
                  <Reveal delay={i * 60} className={`${left ? "lg:col-start-1 lg:pr-8" : "lg:col-start-2 lg:pl-8"}`}>
                    <div
                      className={`sticker group relative rounded-xl bg-paper p-5 transition-transform duration-300 hover:-translate-y-1 hover:rotate-0 sm:p-6 ${
                        left ? "lg:-rotate-1" : "lg:rotate-1"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <span
                          className={`sticker-sm flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${s.bg} transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110`}
                        >
                          {s.icon}
                        </span>
                        <div className="min-w-0">
                          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-tang-deep">
                            langkah {s.n} • {s.tag}
                          </p>
                          <h3 className="mt-1 font-display text-xl font-extrabold leading-tight sm:text-2xl">{s.title}</h3>
                        </div>
                        <span className="text-outline-pine ml-auto hidden select-none font-display text-6xl font-extrabold leading-none sm:block" aria-hidden>
                          {s.n}
                        </span>
                      </div>
                      <p className="mt-3 text-[15px] font-medium leading-relaxed text-ink/70">{s.desc}</p>
                    </div>
                  </Reveal>

                  {/* node di garis tengah */}
                  <span
                    className="absolute left-1/2 top-1/2 z-10 hidden h-6 w-6 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-md border-2 border-ink bg-tang lg:block"
                    aria-hidden
                  />
                </li>
              );
            })}
          </ol>
        </div>

        <Reveal delay={120}>
          <div className="sticker mx-auto mt-12 flex max-w-xl flex-wrap items-center justify-center gap-3 rounded-full bg-pine px-6 py-3.5 text-center">
            <UsbIcon size={19} className="text-leaf" />
            <span className="font-display text-sm font-extrabold text-paper">
              Satu-satunya kabel di sistem ini: USB OTG dari HP Android ke printer.
            </span>
            <LockIcon size={17} className="text-tang" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
