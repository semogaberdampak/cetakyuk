import { useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { useApp } from "../state";
import { buildZpl, downloadZpl, fmtTime, type PrintJob, type JobStatus } from "../lib/printjob";
import { Reveal, SectionHead, MonoChip, StatusDot } from "./ui";
import {
  LockIcon, ShieldIcon, UserIcon, PrinterIcon, DownloadIcon, TrashIcon, CopyIcon, XIcon,
  WifiIcon, UsbIcon, BoltIcon, SendIcon, CheckIcon,
} from "./Icons";

const STATUS_UI: Record<JobStatus, { label: string; cls: string }> = {
  antre: { label: "antre", cls: "bg-mint" },
  mencetak: { label: "mencetak…", cls: "bg-tang" },
  selesai: { label: "selesai ✓", cls: "bg-leaf" },
  offline: { label: "antre lokal", cls: "bg-cream" },
};

export default function ControlRoom() {
  const { user } = useApp();
  return (
    <section id="kontrol" className="relative overflow-hidden border-b-2 border-ink bg-cream">
      <div className="grid-soft absolute inset-0" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <Reveal>
          <SectionHead
            kicker="ruang kontrol"
            title={
              <>
                Pusat komando <span className="underline decoration-tang decoration-[6px] underline-offset-4">server HP.</span>
              </>
            }
            sub="Cuma yang pegang kredensial yang boleh masuk. Superuser ngatur antrean & printer, user reguler lihat lacinya sendiri."
          />
        </Reveal>

        {!user ? <LockedPanel /> : user.role === "super" ? <SuperPanel /> : <UserPanel />}
      </div>
    </section>
  );
}

/* ================= terkunci ================= */
function LockedPanel() {
  const { openLogin } = useApp();
  return (
    <Reveal>
      <div className="sticker-lg relative mx-auto max-w-2xl overflow-hidden rounded-2xl bg-paper p-8 text-center sm:p-12">
        <div className="halftone-pine absolute inset-x-0 bottom-0 h-24 opacity-10" aria-hidden />
        <span className="sticker mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-mint">
          <LockIcon size={36} className="text-pine" />
        </span>
        <h3 className="mt-5 font-display text-3xl font-extrabold">Digembok. Ya iyalah.</h3>
        <p className="mx-auto mt-3 max-w-md text-base font-medium leading-relaxed text-ink/65">
          Semua foto yang dikirim user mendarat di sini — dan cuma bisa dibuka pakai kredensial login. Masuk dulu buat
          lihat antrean cetak.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => openLogin("super")}
            className="press sticker inline-flex items-center gap-2 rounded-full bg-pine px-5 py-3 font-display text-sm font-extrabold text-paper"
          >
            <ShieldIcon size={17} /> Login Superuser
          </button>
          <button
            onClick={() => openLogin("user")}
            className="press sticker inline-flex items-center gap-2 rounded-full bg-leaf px-5 py-3 font-display text-sm font-extrabold"
          >
            <UserIcon size={17} /> Masuk User Reguler
          </button>
        </div>
        <p className="mt-5 font-hand text-2xl font-semibold text-tang-deep">contekan kredensial ada di dalam modal~</p>
      </div>
    </Reveal>
  );
}

/* ================= superuser ================= */
function SuperPanel() {
  const { jobs, patchJob, removeJob, labelsLeft, useLabel, toast, serverUrl, setServerUrl, user } = useApp();
  const [zplJob, setZplJob] = useState<PrintJob | null>(null);
  const [testWiggle, setTestWiggle] = useState(false);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const print = (job: PrintJob) => {
    if (labelsLeft <= 0) {
      toast("Label habis! Isi dulu gulungan 100×100-nya.", "err");
      return;
    }
    patchJob(job.id, { status: "mencetak" });
    toast(`${job.id} dikirim ke GC420T lewat OTG…`, "info");
    timers.current.push(
      window.setTimeout(() => {
        patchJob(job.id, { status: "selesai" });
        useLabel();
        confetti({ particleCount: 45, spread: 60, origin: { y: 0.6 }, colors: ["#7cc24b", "#f5873c", "#bce3ce"] });
        toast(`${job.id} kelar dicetak! Ambil di nampan ya.`, "ok");
      }, 2200)
    );
  };

  const testPrint = () => {
    setTestWiggle(true);
    timers.current.push(window.setTimeout(() => setTestWiggle(false), 1400));
    if (labelsLeft <= 0) {
      toast("Label habis, tes cetak ditolak printer.", "err");
      return;
    }
    useLabel();
    toast("Tes cetak dikirim — Zebra-nya sampai kedip-kedip senang.", "ok");
  };

  const count = (s: JobStatus) => jobs.filter((j) => j.status === s).length;

  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.35fr]">
      {/* --- status printer & server --- */}
      <Reveal>
        <div className="sticker-lg rounded-2xl bg-pine p-6 text-paper">
          <div className="flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 font-display text-xl font-extrabold">
              <span className={testWiggle ? "anim-wiggle inline-flex" : "inline-flex"}>
                <PrinterIcon size={22} className="text-leaf" />
              </span>
              Status Mesin
            </h3>
            <span className="sticker-sm rounded-full bg-pine-deep px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-widest text-mint">
              @{user?.username}
            </span>
          </div>

          <ul className="mt-5 space-y-3 font-mono text-[12px] font-bold">
            <li className="flex items-center justify-between rounded-lg bg-pine-deep/60 px-3.5 py-2.5">
              <span className="flex items-center gap-2 uppercase tracking-widest text-mint">
                <UsbIcon size={15} className="text-tang" /> USB OTG
              </span>
              <span className="flex items-center gap-2"><StatusDot tone="ok" /> GC420T kehubung</span>
            </li>
            <li className="flex items-center justify-between rounded-lg bg-pine-deep/60 px-3.5 py-2.5">
              <span className="flex items-center gap-2 uppercase tracking-widest text-mint">
                <WifiIcon size={15} className="text-tang" /> hotspot
              </span>
              <span>192.168.43.1 • 3 klien</span>
            </li>
            <li className="rounded-lg bg-pine-deep/60 px-3.5 py-2.5">
              <span className="flex justify-between uppercase tracking-widest text-mint">
                <span>label 100×100 tersisa</span>
                <span className={labelsLeft < 6 ? "text-tang" : "text-leaf"}>{labelsLeft} lembar</span>
              </span>
              <span className="mt-2 block h-3 overflow-hidden rounded-full border border-mint/30 bg-pine-deep">
                <span
                  className="block h-full rounded-full bg-leaf transition-all duration-700"
                  style={{ width: `${Math.min(100, (labelsLeft / 30) * 100)}%` }}
                />
              </span>
            </li>
            <li className="rounded-lg bg-pine-deep/60 px-3.5 py-2.5">
              <span className="flex justify-between uppercase tracking-widest text-mint">
                <span>ribbon transfer</span>
                <span className="text-leaf">64%</span>
              </span>
              <span className="mt-2 block h-3 overflow-hidden rounded-full border border-mint/30 bg-pine-deep">
                <span className="block h-full w-[64%] rounded-full bg-tang" />
              </span>
            </li>
          </ul>

          <button
            onClick={testPrint}
            className="press sticker mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-tang py-3 font-display text-base font-extrabold text-ink"
          >
            <BoltIcon size={18} /> Tes Cetak
          </button>

          <label className="mt-5 block">
            <span className="mb-1 block font-mono text-[9.5px] font-bold uppercase tracking-[0.18em] text-mint">
              alamat server — QR di atas ikut berubah
            </span>
            <input
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              spellCheck={false}
              className="sticker-sm w-full rounded-lg bg-paper px-3 py-2 font-mono text-xs font-bold text-pine outline-none focus:bg-mint/50"
            />
          </label>
        </div>
      </Reveal>

      {/* --- antrean --- */}
      <Reveal delay={120}>
        <div className="flex flex-wrap gap-2">
          <MonoChip className="bg-paper">total {jobs.length}</MonoChip>
          <MonoChip className="bg-paper">antre {count("antre") + count("offline")}</MonoChip>
          <MonoChip className="bg-paper">mencetak {count("mencetak")}</MonoChip>
          <MonoChip className="bg-paper">selesai {count("selesai")}</MonoChip>
        </div>

        <div className="mt-4 space-y-3">
          {jobs.length === 0 && (
            <p className="sticker rounded-xl bg-paper p-8 text-center font-display text-lg font-extrabold text-ink/50">
              Antrean kosong. Suruh orang-orang scan QR dong!
            </p>
          )}
          {jobs.map((j) => (
            <div key={j.id} className="sticker group flex flex-wrap items-center gap-3.5 rounded-xl bg-paper p-3.5 transition-transform hover:-translate-y-0.5 sm:flex-nowrap">
              <img src={j.thumb} alt={`cetakan ${j.id}`} className="pixelated sticker-sm h-16 w-16 shrink-0 rounded-lg bg-cream" />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-pine">{j.id}</span>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/40">
                    @{j.owner} • {fmtTime(j.ts)} • {j.mode}
                  </span>
                </p>
                <p className="truncate font-hand text-xl font-semibold leading-tight text-ink/85">
                  {j.caption || "— tanpa catatan —"}
                </p>
              </div>
              <span
                className={`sticker-sm inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 font-display text-[11px] font-extrabold ${STATUS_UI[j.status].cls}`}
              >
                {j.status === "mencetak" && (
                  <span className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-ink border-t-transparent" />
                )}
                {STATUS_UI[j.status].label}
              </span>
              <div className="flex shrink-0 gap-1.5">
                {(j.status === "antre" || j.status === "offline" || j.status === "selesai") && (
                  <button
                    onClick={() => print(j)}
                    title={j.status === "selesai" ? "Cetak ulang" : "Cetak sekarang"}
                    className="press sticker-sm rounded-lg bg-pine p-2 text-paper"
                  >
                    <SendIcon size={15} />
                  </button>
                )}
                <button onClick={() => setZplJob(j)} title="Lihat ZPL" className="press sticker-sm rounded-lg bg-leaf p-2">
                  <CopyIcon size={15} />
                </button>
                <button
                  onClick={() => {
                    removeJob(j.id);
                    toast(`${j.id} dihapus dari antrean.`, "info");
                  }}
                  title="Hapus"
                  className="press sticker-sm rounded-lg bg-berry p-2 text-paper"
                >
                  <TrashIcon size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Reveal>

      {zplJob && <ZplModal job={zplJob} onClose={() => setZplJob(null)} />}
    </div>
  );
}

/* ================= user reguler ================= */
function UserPanel() {
  const { jobs, removeJob, user, toast } = useApp();
  const [zplJob, setZplJob] = useState<PrintJob | null>(null);
  const mine = jobs.filter((j) => j.owner === user?.username);

  return (
    <Reveal>
      <div className="sticker-lg rounded-2xl bg-paper p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2.5 font-display text-2xl font-extrabold">
            <span className="sticker-sm flex h-10 w-10 items-center justify-center rounded-lg bg-leaf">
              <UserIcon size={20} />
            </span>
            Laci cetakanmu, @{user?.username}
          </h3>
          <MonoChip className="bg-mint">{mine.length} kiriman</MonoChip>
        </div>

        {mine.length === 0 ? (
          <p className="mt-8 rounded-xl border-2 border-dashed border-ink/20 p-10 text-center font-display text-lg font-extrabold text-ink/45">
            Belum ada. Sana scroll ke atas, kirim satu yang lucu! <span className="inline-block -rotate-12">👆</span>
          </p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mine.map((j) => (
              <div key={j.id} className="sticker group rounded-xl bg-cream p-3.5 transition-transform hover:-translate-y-1 hover:-rotate-1">
                <img src={j.thumb} alt={`cetakan ${j.id}`} className="pixelated sticker-sm w-full rounded-lg bg-paper" />
                <p className="mt-3 truncate font-hand text-xl font-semibold leading-tight">{j.caption || "— tanpa catatan —"}</p>
                <p className="mt-1 font-mono text-[10px] font-bold uppercase tracking-widest text-ink/45">
                  {j.id} • {fmtTime(j.ts)} • {STATUS_UI[j.status].label}
                </p>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => setZplJob(j)} className="press sticker-sm flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-leaf py-2 font-display text-xs font-extrabold">
                    <DownloadIcon size={14} /> ZPL
                  </button>
                  <button
                    onClick={() => {
                      removeJob(j.id);
                      toast(`${j.id} dihapus dari lacimu.`, "info");
                    }}
                    className="press sticker-sm rounded-lg bg-berry p-2 text-paper"
                    title="Hapus"
                  >
                    <TrashIcon size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {zplJob && <ZplModal job={zplJob} onClose={() => setZplJob(null)} />}
    </Reveal>
  );
}

/* ================= modal ZPL ================= */
function ZplModal({ job, onClose }: { job: PrintJob; onClose: () => void }) {
  const { toast } = useApp();
  const zpl = useMemo(() => buildZpl(job), [job]);
  const preview = useMemo(() => (zpl.length > 1400 ? `${zpl.slice(0, 700)}\n\n… ${((zpl.length - 1400) / 1024).toFixed(0)} KB data bitmap di sini …\n\n${zpl.slice(-700)}` : zpl), [zpl]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal>
      <button aria-label="Tutup" className="absolute inset-0 bg-pine-deep/75" onClick={onClose} />
      <div className="sticker-lg anim-pop relative flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl bg-paper p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 className="font-display text-xl font-extrabold">
            ZPL buat <span className="text-pine">{job.id}</span>
          </h3>
          <button onClick={onClose} className="press sticker-sm rounded-full bg-tang p-2" aria-label="Tutup">
            <XIcon size={14} />
          </button>
        </div>
        <p className="mb-3 font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-ink/50">
          ^GFA 640×640 • 51.200 byte • siap ditembak ke GC420T via OTG
        </p>
        <pre className="min-h-0 flex-1 overflow-auto rounded-lg border-2 border-ink bg-pine-deep p-4 font-mono text-[10.5px] leading-relaxed text-mint">
          {preview}
        </pre>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => {
              navigator.clipboard?.writeText(zpl).then(
                () => toast("ZPL tersalin. Tempel di mana suka.", "ok"),
                () => toast("Gagal nyalin — browser-nya pelit.", "err")
              );
            }}
            className="press sticker flex items-center gap-2 rounded-lg bg-leaf px-4 py-2.5 font-display text-sm font-extrabold"
          >
            <CopyIcon size={16} /> Salin
          </button>
          <button
            onClick={() => {
              downloadZpl(job);
              toast("File .zpl lagi meluncur ke download.", "ok");
            }}
            className="press sticker flex items-center gap-2 rounded-lg bg-tang px-4 py-2.5 font-display text-sm font-extrabold"
          >
            <DownloadIcon size={16} /> Unduh .zpl
          </button>
          <span className="ml-auto hidden items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ink/45 sm:flex">
            <CheckIcon size={13} className="text-pine" /> {(zpl.length / 1024).toFixed(0)} KB teks
          </span>
        </div>
      </div>
    </div>
  );
}
