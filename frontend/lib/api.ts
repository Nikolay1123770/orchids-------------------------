const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3002';

let _token: string | null = null;

export function setToken(t: string | null) {
  _token = t;
}

async function apiFetch(path: string, options?: RequestInit) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (_token) headers['Authorization'] = `Bearer ${_token}`;
  const res = await fetch(`${BASE_URL}${path}`, { headers, ...options });
  return res.json();
}

// ─── Auth ──────────────────────────────────────────────────────────────────────
export async function register(email: string, password: string) {
  return apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export async function login(email: string, password: string) {
  return apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export async function getMe() {
  return apiFetch('/api/auth/me');
}

// ─── Plans & Payments ─────────────────────────────────────────────────────────
export async function fetchPlans() {
  return apiFetch('/api/plans');
}

export async function createPayment(plan: string) {
  return apiFetch('/api/payment/create', { method: 'POST', body: JSON.stringify({ plan }) });
}

export async function checkPaymentStatus(label: string) {
  return apiFetch(`/api/payment/status?label=${encodeURIComponent(label)}`);
}

// ─── VPN ──────────────────────────────────────────────────────────────────────
export async function connectVPN() {
  return apiFetch('/api/vpn/connect', { method: 'POST' });
}

export async function disconnectVPN() {
  return apiFetch('/api/vpn/disconnect', { method: 'POST' });
}

export async function fetchTraffic() {
  return apiFetch('/api/vpn/traffic');
}

export async function fetchVPNStatus() {
  return apiFetch('/api/vpn/status');
}

export async function fetchServers() {
  return apiFetch('/api/servers');
}

// ─── Util ─────────────────────────────────────────────────────────────────────
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Б';
  const k = 1024;
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
