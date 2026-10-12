import { useEffect, useState, type FormEvent } from "react";
import confetti from "canvas-confetti";
import { useApp, type Role } from "../state";
import { ShieldIcon, UserIcon, XIcon, LockIcon, KeyIcon, AlertTriangleIcon } from "./Icons";

export default function LoginModal() {
  const { loginOpen, closeLogin, login, toast, isLocked, lockoutRemaining } = useApp();
  const [role, setRole] = useState<Role>("user");
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [shake, setShake] = useState(0);
  const [peek, setPeek] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (loginOpen) {
      setRole(loginOpen);
      setU("");
      setP("");
      setPeek(false);
      setShake(0);
    }
  }, [loginOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeLogin();
    if (loginOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [loginOpen, closeLogin]);

  if (!loginOpen) return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (isLocked || loading) return;

    setLoading(true);
    const result = await login(role, u, p);
    setLoading(false);

    if (result.success) {
      confetti({ particleCount: 90, spread: 75, origin: { y: 0.35 }, colors: ["#7cc24b", "#f5873c", "#bce3ce", "#1a5c46"] });
      toast(`Halo! Kamu masuk sebagai ${role === "super" ? "Superuser" : "User Reguler"}.`, "ok");
      closeLogin();
      setTimeout(() => document.getElementById("kontrol")?.scrollIntoView({ behavior: "smooth" }), 250);
    } else {
      setShake((s) => s + 1);
      toast(result.error || "Kredensial salah. Coba cek contekan di bawah ya.", "err");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal>
      <button aria-label="Tutup" onClick={closeLogin} className="absolute inset-0 bg-pine-deep/70" />
      <div
        key={shake}
        className={`sticker-lg relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-xl bg-paper p-5 sm:p-7 ${shake ? "anim-wiggle" : "anim-pop"}`}
      >
        <button
          onClick={closeLogin}
          className="press sticker-sm absolute -right-3 -top-3 rounded-full bg-tang p-2"
          aria-label="Tutup dialog"
        >
          <XIcon size={16} />
        </button>

        {isLocked && (
          <div className="mb-4 sticker-sm rounded-lg bg-berry/15 border border-berry/30 p-3 text-center">
            <p className="flex items-center justify-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-berry">
              <AlertTriangleIcon size={12} /> Akun terkunci sementara
            </p>
            <p className="mt-1 font-display text-sm font-bold text-berry">
              Coba lagi dalam {lockoutRemaining} detik
            </p>
          </div>
        )}

        <div className="mb-5 flex items-center gap-3">
          <span className="sticker-sm rounded-lg bg-leaf p-2.5">
            <KeyIcon size={22} />
          </span>
          <div>
            <h3 className="font-display text-2xl font-extrabold leading-none">Buka gembok server</h3>
            <p className="mt-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-pine">
              file cuma masuk lewat kredensial
            </p>
          </div>
        </div>

        <div className="sticker-sm mb-5 grid grid-cols-2 overflow-hidden rounded-lg bg-cream p-1">
          {(["user", "super"] as Role[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              disabled={isLocked || loading}
              className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-2 font-display text-xs font-extrabold transition-all ${
                role === r ? "bg-pine text-paper shadow-sticker-sm" : "text-ink/60 hover:text-ink disabled:opacity-40"
              }`}
            >
              {r === "super" ? <ShieldIcon size={14} /> : <UserIcon size={14} />}
              {r === "super" ? "Superuser" : "User Reguler"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-3">
          <label className="block">
            <span className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-ink/60">
              username
            </span>
            <input
              value={u}
              onChange={(e) => setU(e.target.value)}
              autoComplete="username"
              required
              placeholder={role === "super" ? "admin" : "tamu"}
              disabled={isLocked || loading}
              className="sticker-sm w-full rounded-lg bg-paper px-3.5 py-2.5 font-display text-sm font-bold outline-none placeholder:text-ink/30 focus:bg-mint/40 disabled:opacity-50"
            />
          </label>
          <label className="block">
            <span className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-ink/60">
              password
            </span>
            <div className="relative">
              <input
                value={p}
                onChange={(e) => setP(e.target.value)}
                type={peek ? "text" : "password"}
                autoComplete="current-password"
                required
                placeholder="••••••••"
                disabled={isLocked || loading}
                className="sticker-sm w-full rounded-lg bg-paper px-3.5 py-2.5 font-display text-sm font-bold outline-none placeholder:text-ink/30 focus:bg-mint/40 disabled:opacity-50 pr-24"
              />
              <button
                type="button"
                onClick={() => setPeek((v) => !v)}
                disabled={isLocked || loading}
                className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[9px] font-bold uppercase tracking-widest text-pine underline decoration-dashed underline-offset-4 hover:text-tang disabled:opacity-40"
              >
                {peek ? "sembunyikan" : "intip"}
              </button>
            </div>
          </label>
          <button
            type="submit"
            disabled={isLocked || loading}
            className="press sticker w-full rounded-lg bg-tang py-3 font-display text-base font-extrabold text-ink disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Memproses…" : "Gas, masuk! →"}
          </button>
        </form>

        {!isLocked && (
          <div className="mt-5 rounded-lg border-2 border-dashed border-pine/40 bg-mint/40 p-3.5">
            <p className="mb-2 flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-pine">
              <LockIcon size={13} /> contekan demo
            </p>
            <div className="space-y-1 font-mono text-[11.5px] font-bold text-ink/80">
              <p>
                superuser → <code className="rounded bg-paper px-1.5 py-0.5">admin</code> /{" "}
                <code className="rounded bg-paper px-1.5 py-0.5">gaskeun42</code>
              </p>
              <p>
                user reguler → <code className="rounded bg-paper px-1.5 py-0.5">tamu</code> /{" "}
                <code className="rounded bg-paper px-1.5 py-0.5">cetakyuk</code>
              </p>
            </div>
            <p className="mt-2 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-ink/50">
              max 5 salah → terkunci 15 menit • password di-hash (PBKDF2) • session 4 jam idle / 24 jam max
            </p>
          </div>
        )}
      </div>
    </div>
  );
}