const BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3002";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("smgvpn_token");
}

function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem("smgvpn_token", token);
  } else {
    localStorage.removeItem("smgvpn_token");
  }
}

async function apiFetch<T = Record<string, unknown>>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { headers, ...options });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP ${res.status}: ${errorText}`);
  }

  return res.json() as Promise<T>;
}

// Auth
export async function register(email: string, password: string) {
  const result = await apiFetch<{
    success: boolean;
    token?: string;
    user?: { id: number; email: string; uuid: string };
    message?: string;
  }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (result.token) setToken(result.token);
  return result;
}

export async function login(email: string, password: string) {
  const result = await apiFetch<{
    success: boolean;
    token?: string;
    user?: { id: number; email: string; uuid: string };
    subscription?: { plan: string; expiresAt: number; active: boolean } | null;
    message?: string;
  }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (result.token) setToken(result.token);
  return result;
}

export async function logout() {
  setToken(null);
}

export async function getMe() {
  return apiFetch<{
    success: boolean;
    user?: { id: number; email: string; uuid: string };
    subscription?: { plan: string; expiresAt: number; active: boolean } | null;
    message?: string;
  }>("/api/auth/me");
}

// Plans
export async function fetchPlans() {
  return apiFetch<{
    success: boolean;
    plans: {
      id: string;
      title: string;
      price: number;
      pricePerDay: string;
      badge?: string;
    }[];
  }>("/api/plans");
}

// Payments
export async function createPayment(plan: string) {
  return apiFetch<{
    success: boolean;
    payUrl?: string;
    label?: string;
    amount?: number;
    message?: string;
  }>("/api/payment/create", {
    method: "POST",
    body: JSON.stringify({ plan }),
  });
}

export async function checkPaymentStatus(label: string) {
  return apiFetch<{
    success: boolean;
    status?: string;
    confirmedAt?: number;
  }>(`/api/payment/status?label=${encodeURIComponent(label)}`);
}

// VPN
export async function connectVPN() {
  return apiFetch<{
    success: boolean;
    message?: string;
    needSubscription?: boolean;
    config?: {
      address: string;
      port: number;
      protocol: string;
      network: string;
      path: string;
      uuid: string;
      email: string;
      vlessUrl: string;
      xrayConfig: Record<string, unknown>;
    };
    subscription?: { plan: string; expiresAt: number };
  }>("/api/vpn/connect", { method: "POST" });
}

export async function disconnectVPN() {
  return apiFetch<{ success: boolean; message?: string }>("/api/vpn/disconnect", {
    method: "POST",
  });
}

export async function fetchTraffic() {
  return apiFetch<{
    success: boolean;
    client?: { up: number; down: number };
  }>("/api/vpn/traffic");
}

export async function fetchVPNStatus() {
  return apiFetch<{
    success: boolean;
    online?: boolean;
    ping?: number;
    inbound?: { id: number; protocol: string; port: number };
  }>("/api/vpn/status");
}

export async function fetchServers() {
  return apiFetch<{
    success: boolean;
    servers: {
      id: string;
      name: string;
      country: string;
      city: string;
      flag: string;
      protocol: string;
      transport: string;
      recommended: boolean;
    }[];
  }>("/api/servers");
}

// Helpers
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Б";
  const k = 1024;
  const sizes = ["Б", "КБ", "МБ", "ГБ", "ТБ"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function formatTime(secs: number): string {
  const h = Math.floor(secs / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((secs % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export { getToken, setToken };
