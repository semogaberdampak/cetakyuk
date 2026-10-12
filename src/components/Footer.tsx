import { useApp } from "../state";
import { LogoMark, HeartIcon, CameraIcon, QrIcon, PrinterIcon } from "./Icons";

export default function Footer() {
  const { serverUrl, openLogin, user } = useApp();
  return (
    <footer className="relative overflow-hidden bg-pine-deep text-paper">
      <div className="halftone-paper absolute inset-0 opacity-[0.06]" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-4 pb-8 pt-14 sm:px-6">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-sm">
            <a href="#atas" className="flex items-center gap-2.5">
              <LogoMark size={44} />
              <span className="font-display text-3xl font-extrabold tracking-tight">CETAKYUK!</span>
            </a>
            <p className="mt-4 text-sm font-medium leading-relaxed text-mint/85">
              Kiosk cetak foto 100×100 mm yang seluruh otaknya muat di satu HP Android. Scan, jepret, cubit, tulis yang
              manis — sisanya biar dither dan Zebra yang kerja.
            </p>
            <p className="mt-5 flex items-center gap-2 font-hand text-2xl font-semibold text-tang">
              dibikin buat seru-seruan <HeartIcon size={20} className="text-tang" />
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            <nav>
              <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-leaf">jelajah</p>
              <ul className="space-y-2 font-display text-sm font-bold">
                {[
                  ["#editor", "Editor Demo"],
                  ["#cara", "Cara Kerja"],
                  ["#mesin", "Mesin"],
                  ["#kontrol", "Ruang Kontrol"],
                  ["#panduan", "Panduan Deploy"],
                ].map(([h, l]) => (
                  <li key={h}>
                    <a href={h} className="text-mint transition-colors hover:text-tang">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <div>
              <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-leaf">mesin</p>
              <ul className="space-y-2 font-mono text-[11.5px] font-bold text-mint">
                <li className="flex items-center gap-2"><PrinterIcon size={14} className="text-tang" /> Zebra GC420T</li>
                <li className="flex items-center gap-2"><CameraIcon size={14} className="text-tang" /> HP Android server</li>
                <li className="flex items-center gap-2"><QrIcon size={14} className="text-tang" /> 203 dpi • 8 dot/mm</li>
              </ul>
            </div>
            <div>
              <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-leaf">akses</p>
              {!user ? (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => openLogin("super")}
                    className="press sticker-sm w-fit rounded-full bg-tang px-4 py-2 font-display text-xs font-extrabold text-ink"
                  >
                    Login Superuser
                  </button>
                  <button
                    onClick={() => openLogin("user")}
                    className="press sticker-sm w-fit rounded-full bg-leaf px-4 py-2 font-display text-xs font-extrabold text-ink"
                  >
                    User Reguler
                  </button>
                </div>
              ) : (
                <p className="font-mono text-[11.5px] font-bold text-mint">
                  masuk sebagai <span className="text-leaf">@{user.username}</span> ({user.role === "super" ? "superuser" : "reguler"})
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t-2 border-dashed border-paper/15 pt-5 sm:flex-row">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-mint/60">
            © 2026 cetakyuk • server: {serverUrl}
          </p>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-mint/60">
            kertas habis = tutup sebentar, jangan ngambek
          </p>
        </div>
      </div>
    </footer>
  );
}
