import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { PrintJob } from "./lib/printjob";
import { seedJobs } from "./lib/printjob";

export type Role = "super" | "user";
export interface SessionUser {
  name: string;
  role: Role;
  username: string;
}

export type ToastKind = "ok" | "err" | "info";
export interface Toast {
  id: number;
  kind: ToastKind;
  msg: string;
}

export const CREDS: Record<Role, { u: string; p: string; name: string; label: string }> = {
  super: { u: "admin", p: "gaskeun42", name: "Bang Operator", label: "Superuser" },
  user: { u: "tamu", p: "cetakyuk", name: "Kamu", label: "User Reguler" },
};

interface AppState {
  user: SessionUser | null;
  login: (role: Role, u: string, p: string) => boolean;
  logout: () => void;
  jobs: PrintJob[];
  addJob: (j: PrintJob) => void;
  patchJob: (id: string, patch: Partial<PrintJob>) => void;
  removeJob: (id: string) => void;
  serverUrl: string;
  setServerUrl: (v: string) => void;
  labelsLeft: number;
  useLabel: () => void;
  toasts: Toast[];
  toast: (msg: string, kind?: ToastKind) => void;
  dismissToast: (id: number) => void;
  loginOpen: Role | null;
  openLogin: (role: Role) => void;
  closeLogin: () => void;
}

const Ctx = createContext<AppState | null>(null);

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp harus di dalam AppProvider");
  return v;
}

let toastSeq = 0;

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => {
    try {
      const raw = localStorage.getItem("cetakyuk-user");
      return raw ? (JSON.parse(raw) as SessionUser) : null;
    } catch {
      return null;
    }
  });
  const [jobs, setJobs] = useState<PrintJob[]>(() => seedJobs());
  const [serverUrl, setServerUrl] = useState("http://192.168.43.1:3000");
  const [labelsLeft, setLabelsLeft] = useState(23);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [loginOpen, setLoginOpen] = useState<Role | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const t = timers.current;
    return () => t.forEach((id) => window.clearTimeout(id));
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((ts) => ts.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (msg: string, kind: ToastKind = "ok") => {
      const id = ++toastSeq;
      setToasts((ts) => [...ts.slice(-3), { id, kind, msg }]);
      timers.current.push(window.setTimeout(() => dismissToast(id), 4200));
    },
    [dismissToast]
  );

  const login = useCallback(
    (role: Role, u: string, p: string) => {
      const c = CREDS[role];
      if (u.trim().toLowerCase() === c.u && p === c.p) {
        const session: SessionUser = { name: c.name, role, username: c.u };
        setUser(session);
        try {
          localStorage.setItem("cetakyuk-user", JSON.stringify(session));
        } catch {
          /* abaikan */
        }
        return true;
      }
      return false;
    },
    []
  );

  const logout = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem("cetakyuk-user");
    } catch {
      /* abaikan */
    }
  }, []);

  const addJob = useCallback((j: PrintJob) => setJobs((js) => [j, ...js]), []);
  const patchJob = useCallback(
    (id: string, patch: Partial<PrintJob>) => setJobs((js) => js.map((j) => (j.id === id ? { ...j, ...patch } : j))),
    []
  );
  const removeJob = useCallback((id: string) => setJobs((js) => js.filter((j) => j.id !== id)), []);
  const useLabel = useCallback(() => setLabelsLeft((n) => Math.max(0, n - 1)), []);

  const value = useMemo<AppState>(
    () => ({
      user,
      login,
      logout,
      jobs,
      addJob,
      patchJob,
      removeJob,
      serverUrl,
      setServerUrl,
      labelsLeft,
      useLabel,
      toasts,
      toast,
      dismissToast,
      loginOpen,
      openLogin: (r: Role) => setLoginOpen(r),
      closeLogin: () => setLoginOpen(null),
    }),
    [user, login, logout, jobs, addJob, patchJob, removeJob, serverUrl, labelsLeft, useLabel, toasts, toast, dismissToast, loginOpen]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
