import { useApp } from "../state";
import { LogoMark, ShieldIcon, UserIcon, XIcon } from "./Icons";
import { StatusDot } from "./ui";

export default function TopBar() {
  const { user, openLogin, logout } = useApp();

  return (
    <header className="sticky top-0 z-40 border-b-2 border-ink bg-paper/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <a href="#atas" className="group flex items-center gap-2.5">
          <span className="transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105">
            <LogoMark size={38} />
          </span>
          <span className="leading-none">
            <span className="block font-display text-xl font-extrabold tracking-tight">CETAKYUK!</span>
            <span className="block font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-pine">
              kiosk foto 100×100
            </span>
          </span>
        </a>

        <nav className="hidden items-center gap-1 font-display text-sm font-bold md:flex">
          {[
            ["#editor", "Editor"],
            ["#cara", "Cara Kerja"],
            ["#mesin", "Mesin"],
            ["#kontrol", "Kontrol"],
            ["#panduan", "Panduan"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="rounded-full px-3 py-1.5 transition-colors hover:bg-mint"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span
                className={`sticker-sm hidden items-center gap-2 rounded-full px-3 py-1.5 font-display text-xs font-extrabold sm:inline-flex ${
                  user.role === "super" ? "bg-pine text-paper" : "bg-leaf text-ink"
                }`}
              >
                {user.role === "super" ? <ShieldIcon size={14} /> : <UserIcon size={14} />}
                {user.name}
                <span className="font-mono text-[9px] uppercase tracking-widest opacity-80">
                  {user.role === "super" ? "superuser" : "reguler"}
                </span>
              </span>
              <button
                onClick={logout}
                title="Keluar"
                className="press sticker-sm inline-flex items-center gap-1 rounded-full bg-tang px-3 py-1.5 font-display text-xs font-extrabold"
              >
                <XIcon size={13} /> Keluar
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => openLogin("user")}
                className="press sticker-sm hidden items-center gap-1.5 rounded-full bg-paper px-3.5 py-2 font-display text-xs font-extrabold sm:inline-flex"
              >
                <UserIcon size={15} /> Masuk
              </button>
              <button
                onClick={() => openLogin("super")}
                className="press sticker-sm inline-flex items-center gap-1.5 rounded-full bg-pine px-3.5 py-2 font-display text-xs font-extrabold text-paper"
              >
                <ShieldIcon size={15} /> <span className="hidden sm:inline">Login Superuser</span>
                <span className="sm:hidden">Super</span>
              </button>
            </>
          )}
        </div>
      </div>

      <nav
        aria-label="Navigasi cepat"
        className="flex gap-1.5 overflow-x-auto border-t border-ink/10 bg-paper px-4 py-2 md:hidden"
      >
        {[
          ["#editor", "Editor"],
          ["#cara", "Cara Kerja"],
          ["#mesin", "Mesin"],
          ["#kontrol", "Kontrol"],
          ["#panduan", "Panduan"],
        ].map(([href, label]) => (
          <a
            key={href}
            href={href}
            className="sticker-sm shrink-0 whitespace-nowrap rounded-full bg-cream px-3 py-1 font-display text-xs font-extrabold transition-colors active:bg-mint"
          >
            {label}
          </a>
        ))}
      </nav>

      <div className="flex items-center gap-2 overflow-x-auto border-t border-ink/10 bg-cream px-4 py-1.5 sm:px-6">
        <StatusDot tone="ok" />
        <span className="whitespace-nowrap font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-pine">
          server HP Android: online • hotspot 192.168.43.1 • OTG → Zebra GC420T siap
        </span>
      </div>
    </header>
  );
}
