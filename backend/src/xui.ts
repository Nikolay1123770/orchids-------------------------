// 3x-ui panel API client
import axios from 'axios';

const PANEL_BASE = 'http://213.176.77.13:2053/YvIop4vYekwC93GqU1';
const USERNAME = 'admin';
const PASSWORD = 'admin';
const INBOUND_ID = 2;

const VPN_CONFIG = {
  address: '213.176.77.13',
  port: 443,
  protocol: 'vless' as const,
  network: 'ws',
  path: '/api',
  security: 'none',
  uuid: 'f9c45ccd-abb2-4a59-96bc-ea48459fd38b',
};

// Singleton cookie session
let sessionCookie: string | null = null;

async function login(): Promise<string> {
  const res = await axios.post(
    `${PANEL_BASE}/login`,
    `username=${USERNAME}&password=${PASSWORD}`,
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      withCredentials: true,
    }
  );
  const setCookie = res.headers['set-cookie'];
  if (!setCookie) throw new Error('Login failed: no cookie');
  sessionCookie = setCookie.join('; ');
  return sessionCookie;
}

async function getSession(): Promise<string> {
  if (!sessionCookie) return await login();
  return sessionCookie;
}

async function apiGet(path: string) {
  const cookie = await getSession();
  try {
    const res = await axios.get(`${PANEL_BASE}${path}`, {
      headers: { Cookie: cookie },
    });
    return res.data;
  } catch (e: any) {
    if (e.response?.status === 401 || e.response?.status === 403) {
      sessionCookie = null;
      const newCookie = await login();
      const res2 = await axios.get(`${PANEL_BASE}${path}`, {
        headers: { Cookie: newCookie },
      });
      return res2.data;
    }
    throw e;
  }
}

async function apiPost(path: string, data: any) {
  const cookie = await getSession();
  try {
    const res = await axios.post(`${PANEL_BASE}${path}`, data, {
      headers: { Cookie: cookie, 'Content-Type': 'application/json' },
    });
    return res.data;
  } catch (e: any) {
    if (e.response?.status === 401 || e.response?.status === 403) {
      sessionCookie = null;
      const newCookie = await login();
      const res2 = await axios.post(`${PANEL_BASE}${path}`, data, {
        headers: { Cookie: newCookie, 'Content-Type': 'application/json' },
      });
      return res2.data;
    }
    throw e;
  }
}

export async function getInbounds() {
  return await apiGet('/panel/api/inbounds/list');
}

export async function getClientTraffic(email: string) {
  return await apiGet(`/panel/api/inbounds/getClientTraffics/${email}`);
}

export async function addClient(email: string, uuid: string, expiryTime = 0, enable = true) {
  const payload = {
    id: INBOUND_ID,
    settings: JSON.stringify({
      clients: [
        {
          id: uuid,
          email,
          enable,
          expiryTime,
          flow: '',
          limitIp: 0,
          totalGB: 0,
        },
      ],
    }),
  };
  return await apiPost('/panel/api/inbounds/addClient', payload);
}

export async function updateClientExpiry(email: string, uuid: string, expiryTimeMs: number) {
  const payload = {
    id: INBOUND_ID,
    settings: JSON.stringify({
      clients: [
        {
          id: uuid,
          email,
          enable: true,
          expiryTime: expiryTimeMs,
          flow: '',
          limitIp: 0,
          totalGB: 0,
        },
      ],
    }),
  };
  return await apiPost(`/panel/api/inbounds/updateClient/${uuid}`, payload);
}

export async function deleteClient(email: string) {
  const inbounds = await getInbounds();
  const inbound = inbounds?.obj?.find((i: any) => i.id === INBOUND_ID);
  if (!inbound) throw new Error('Inbound not found');
  const settings = JSON.parse(inbound.settings || '{}');
  const client = settings.clients?.find((c: any) => c.email === email);
  if (!client) return { success: true }; // already gone
  return await apiPost(`/panel/api/inbounds/${INBOUND_ID}/delClient/${client.id}`, {});
}

export async function getAllTraffic() {
  const inbounds = await getInbounds();
  const inbound = inbounds?.obj?.find((i: any) => i.id === INBOUND_ID);
  if (!inbound) return { up: 0, down: 0, total: 0 };
  return {
    up: inbound.up || 0,
    down: inbound.down || 0,
    total: (inbound.up || 0) + (inbound.down || 0),
  };
}

export { VPN_CONFIG, INBOUND_ID };
