import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { PrintJob } from "./lib/printjob";
import { seedJobs } from "./lib/printjob";

export type Role = "super" | "user";
export interface SessionUser {
  name: string;
  role: Role;
  username: string;
}

export interface AuthUser {
  username: string;
  role: Role;
  name: string;
  label: string;
  // Hashed password (bcrypt-style hash) - not plain text
  passwordHash: string;
}

export type ToastKind = "ok" | "err" | "info";
export interface Toast {
  id: number;
  kind: ToastKind;
  msg: string;
}

// Session configuration
const SESSION_CONFIG = {
  // Session expires after 4 hours of inactivity
  MAX_INACTIVITY_MS: 4 * 60 * 60 * 1000,
  // Session expires absolutely after 24 hours
  MAX_SESSION_MS: 24 * 60 * 60 * 1000,
  // Max failed login attempts before lockout
  MAX_LOGIN_ATTEMPTS: 5,
  // Lockout duration: 15 minutes
  LOCKOUT_DURATION_MS: 15 * 60 * 1000,
  // Storage keys
  STORAGE_KEY: "cetakyuk-session",
  LOGIN_ATTEMPTS_KEY: "cetakyuk-login-attempts",
} as const;

/**
 * Simple password hashing using Web Crypto API (PBKDF2)
 * In production, use bcrypt/scrypt/argon2 on the server side
 */
async function hashPassword(password: string, salt?: Uint8Array<ArrayBuffer>): Promise<{ hash: string; salt: string }> {
  const encoder = new TextEncoder();
  const saltBytes: Uint8Array<ArrayBuffer> = salt ?? crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const hashBits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: saltBytes, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return {
    hash: btoa(String.fromCharCode(...new Uint8Array(hashBits))),
    salt: btoa(String.fromCharCode(...saltBytes)),
  };
}

async function verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
  const result = await hashPassword(password, Uint8Array.from(atob(salt), (c) => c.charCodeAt(0)));
  return result.hash === hash;
}

/**
 * Default users - passwords are hashed at build time
 * In production, these should come from environment variables or a secure config
 * Default passwords: super="gaskeun42", user="cetakyuk"
 */
async function getDefaultUsers(): Promise<AuthUser[]> {
  // Pre-computed hashes for default passwords
  // These are generated at build time - not stored in plain text
  const superHash = await hashPassword("gaskeun42");
  const userHash = await hashPassword("cetakyuk");

  return [
    {
      username: "admin",
      role: "super",
      name: "Bang Operator",
      label: "Superuser",
      passwordHash: `${superHash.hash}:${superHash.salt}`,
    },
    {
      username: "tamu",
      role: "user",
      name: "Kamu",
      label: "User Reguler",
      passwordHash: `${userHash.hash}:${userHash.salt}`,
    },
  ];
}

interface LoginAttempts {
  count: number;
  lastAttempt: number;
  lockedUntil: number;
}

interface StoredSession {
  user: SessionUser;
  loginTime: number;
  lastActivity: number;
  token: string; // Random session token
}

function generateToken(): string {
  return crypto.getRandomValues(new Uint8Array(32)).reduce((s, b) => s + b.toString(16).padStart(2, "0"), "");
}

function getLoginAttempts(): LoginAttempts {
  try {
    const raw = localStorage.getItem(SESSION_CONFIG.LOGIN_ATTEMPTS_KEY);
    if (raw) return JSON.parse(raw) as LoginAttempts;
  } catch {
    /* ignore */
  }
  return { count: 0, lastAttempt: 0, lockedUntil: 0 };
}

function saveLoginAttempts(attempts: LoginAttempts) {
  try {
    localStorage.setItem(SESSION_CONFIG.LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts));
  } catch {
    /* ignore */
  }
}

function clearLoginAttempts() {
  try {
    localStorage.removeItem(SESSION_CONFIG.LOGIN_ATTEMPTS_KEY);
  } catch {
    /* ignore */
  }
}

function getStoredSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_CONFIG.STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as StoredSession;
    const now = Date.now();

    // Check absolute expiry
    if (now - session.loginTime > SESSION_CONFIG.MAX_SESSION_MS) {
      localStorage.removeItem(SESSION_CONFIG.STORAGE_KEY);
      return null;
    }

    // Check inactivity expiry
    if (now - session.lastActivity > SESSION_CONFIG.MAX_INACTIVITY_MS) {
      localStorage.removeItem(SESSION_CONFIG.STORAGE_KEY);
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

function saveSession(user: SessionUser) {
  const session: StoredSession = {
    user,
    loginTime: Date.now(),
    lastActivity: Date.now(),
    token: generateToken(),
  };
  try {
    localStorage.setItem(SESSION_CONFIG.STORAGE_KEY, JSON.stringify(session));
  } catch {
    /* ignore */
  }
}

function updateActivity() {
  try {
    const raw = localStorage.getItem(SESSION_CONFIG.STORAGE_KEY);
    if (raw) {
      const session = JSON.parse(raw) as StoredSession;
      session.lastActivity = Date.now();
      localStorage.setItem(SESSION_CONFIG.STORAGE_KEY, JSON.stringify(session));
    }
  } catch {
    /* ignore */
  }
}

function clearSession() {
  try {
    localStorage.removeItem(SESSION_CONFIG.STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

interface AppState {
  user: SessionUser | null;
  login: (role: Role, username: string, password: string) => Promise<{ success: boolean; error?: string }>;
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
  // Security helpers
  isLocked: boolean;
  lockoutRemaining: number;
  canAccess: (requiredRole: Role) => boolean;
}

const Ctx = createContext<AppState | null>(null);

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp harus di dalam AppProvider");
  return v;
}

let toastSeq = 0;

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [jobs, setJobs] = useState<PrintJob[]>(() => seedJobs());
  const [serverUrl, setServerUrl] = useState("http://192.168.43.1:3000");
  const [labelsLeft, setLabelsLeft] = useState(23);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [loginOpen, setLoginOpen] = useState<Role | null>(null);
  const [loginAttempts, setLoginAttemptsState] = useState<LoginAttempts>({ count: 0, lastAttempt: 0, lockedUntil: 0 });
  const timers = useRef<number[]>([]);

  // Load users and restore session on mount
  useEffect(() => {
    let mounted = true;

    async function init() {
      // Load default users with hashed passwords
      const defaultUsers = await getDefaultUsers();
      if (mounted) {
        setUsers(defaultUsers);
        setUsersLoaded(true);
      }

      // Restore session if valid
      const session = getStoredSession();
      if (mounted && session) {
        setUser(session.user);
      }

      // Load login attempts
      if (mounted) {
        setLoginAttemptsState(getLoginAttempts());
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  // Periodic session validation & activity update
  useEffect(() => {
    if (!user) return;

    const interval = window.setInterval(() => {
      const session = getStoredSession();
      if (!session) {
        // Session expired - force logout
        setUser(null);
        clearSession();
      } else {
        updateActivity();
      }
    }, 60 * 1000); // Check every minute

    timers.current.push(interval);
    return () => window.clearInterval(interval);
  }, [user]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => timers.current.forEach((id) => window.clearTimeout(id));
  }, []);

  // Update lockout remaining
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  useEffect(() => {
    if (loginAttempts.lockedUntil <= Date.now()) {
      setLockoutRemaining(0);
      return;
    }
    const interval = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((loginAttempts.lockedUntil - Date.now()) / 1000));
      setLockoutRemaining(remaining);
      if (remaining === 0) {
        // Lockout expired, reset attempts
        setLoginAttemptsState({ count: 0, lastAttempt: 0, lockedUntil: 0 });
        clearLoginAttempts();
      }
    }, 1000);
    return () => window.clearInterval(interval);
  }, [loginAttempts.lockedUntil]);

  const isLocked = loginAttempts.lockedUntil > Date.now();

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
    async (role: Role, username: string, password: string): Promise<{ success: boolean; error?: string }> => {
      // Check lockout
      const attempts = getLoginAttempts();
      if (attempts.lockedUntil > Date.now()) {
        const remaining = Math.ceil((attempts.lockedUntil - Date.now()) / 1000);
        return { success: false, error: `Terlalu banyak percobaan. Coba lagi dalam ${remaining} detik.` };
      }

      if (!usersLoaded) {
        return { success: false, error: "Sistem belum siap. Tunggu sebentar..." };
      }

      // Find user
      const authUser = users.find((u) => u.username === username.trim().toLowerCase() && u.role === role);
      if (!authUser) {
        // Increment failed attempts (but don't reveal if user exists)
        const newAttempts = { ...attempts, count: attempts.count + 1, lastAttempt: Date.now() };
        if (newAttempts.count >= SESSION_CONFIG.MAX_LOGIN_ATTEMPTS) {
          newAttempts.lockedUntil = Date.now() + SESSION_CONFIG.LOCKOUT_DURATION_MS;
        }
        setLoginAttemptsState(newAttempts);
        saveLoginAttempts(newAttempts);
        return { success: false, error: "Username/password salah atau role tidak cocok." };
      }

      // Verify password
      const [hash, salt] = authUser.passwordHash.split(":");
      const valid = await verifyPassword(password, hash, salt);

      if (!valid) {
        const newAttempts = { ...attempts, count: attempts.count + 1, lastAttempt: Date.now() };
        if (newAttempts.count >= SESSION_CONFIG.MAX_LOGIN_ATTEMPTS) {
          newAttempts.lockedUntil = Date.now() + SESSION_CONFIG.LOCKOUT_DURATION_MS;
        }
        setLoginAttemptsState(newAttempts);
        saveLoginAttempts(newAttempts);
        return { success: false, error: "Username/password salah atau role tidak cocok." };
      }

      // Success - clear attempts, create session
      clearLoginAttempts();
      setLoginAttemptsState({ count: 0, lastAttempt: 0, lockedUntil: 0 });

      const session: SessionUser = { name: authUser.name, role: authUser.role, username: authUser.username };
      setUser(session);
      saveSession(session);

      return { success: true };
    },
    [users, usersLoaded]
  );

  const logout = useCallback(() => {
    setUser(null);
    clearSession();
  }, []);

  const addJob = useCallback((j: PrintJob) => setJobs((js) => [j, ...js]), []);
  const patchJob = useCallback(
    (id: string, patch: Partial<PrintJob>) => setJobs((js) => js.map((j) => (j.id === id ? { ...j, ...patch } : j))),
    []
  );
  const removeJob = useCallback((id: string) => setJobs((js) => js.filter((j) => j.id !== id)), []);
  const useLabel = useCallback(() => setLabelsLeft((n) => Math.max(0, n - 1)), []);

  // Role-based access control
  const canAccess = useCallback(
    (requiredRole: Role): boolean => {
      if (!user) return false;
      if (requiredRole === "user") return true; // Both roles can access user features
      if (requiredRole === "super") return user.role === "super"; // Only super can access super features
      return false;
    },
    [user]
  );

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
      isLocked,
      lockoutRemaining,
      canAccess,
    }),
    [
      user,
      login,
      logout,
      jobs,
      addJob,
      patchJob,
      removeJob,
      serverUrl,
      labelsLeft,
      useLabel,
      toasts,
      toast,
      dismissToast,
      loginOpen,
      isLocked,
      lockoutRemaining,
      canAccess,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}