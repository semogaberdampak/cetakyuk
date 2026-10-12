import { AppProvider, useApp } from "./state";
import TopBar from "./components/TopBar";
import Hero from "./components/Hero";
import Editor from "./components/Editor";
import HowItWorks from "./components/HowItWorks";
import Hardware from "./components/Hardware";
import ControlRoom from "./components/ControlRoom";
import DeployGuide from "./components/DeployGuide";
import Footer from "./components/Footer";
import LoginModal from "./components/LoginModal";
import { DoodleField, Marquee } from "./components/ui";
import { CheckIcon, XIcon, BoltIcon } from "./components/Icons";

const TICKER_A = [
  "scan QR-nya",
  "pilih dari galeri",
  "atau jepret langsung",
  "cubit buat zoom",
  "tulis pesan manis",
  "dither 1-bit",
  "kertas 100×100 mm",
  "zebra gc420t",
];
const TICKER_B = [
  "server = hp android",
  "usb otg doang",
  "8 dot per mm",
  "640×640 dot",
  "tanpa cloud",
  "tanpa install app",
  "±40 detik / label",
  "gratis*",
];

function ToastStack() {
  const { toasts, dismissToast } = useApp();
  const style = {
    ok: { bg: "bg-leaf", icon: <CheckIcon size={16} /> },
    err: { bg: "bg-berry text-paper", icon: <XIcon size={16} /> },
    info: { bg: "bg-tang", icon: <BoltIcon size={16} /> },
  } as const;
  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col gap-2.5 sm:inset-x-auto sm:right-4 sm:w-[min(92vw,380px)]">
      {toasts.map((t) => (
        <div key={t.id} className="sticker anim-toast pointer-events-auto flex items-start gap-2.5 rounded-xl bg-paper p-3.5">
          <span className={`sticker-sm mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${style[t.kind].bg}`}>
            {style[t.kind].icon}
          </span>
          <p className="flex-1 font-display text-sm font-bold leading-snug">{t.msg}</p>
          <button
            onClick={() => dismissToast(t.id)}
            className="rounded-full p-1 text-ink/40 transition-colors hover:text-berry"
            aria-label="Tutup notifikasi"
          >
            <XIcon size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

function Shell() {
  return (
    <div className="relative min-h-screen">
      <DoodleField />
      <div className="relative z-10">
        <TopBar />
        <main>
          <Hero />
          <Marquee items={TICKER_A} className="bg-tang text-ink" speed={30} />
          <Editor />
          <HowItWorks />
          <Marquee items={TICKER_B} className="bg-leaf text-ink" speed={34} />
          <Hardware />
          <ControlRoom />
          <DeployGuide />
        </main>
        <Footer />
      </div>
      <LoginModal />
      <ToastStack />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
