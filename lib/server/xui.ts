// 3x-ui panel API client using native fetch (no axios needed)

const PANEL_BASE = "http://213.176.77.13:2053/YvIop4vYekwC93GqU1";
const USERNAME = "admin";
const PASSWORD = "admin";
export const INBOUND_ID = 2;

export const VPN_CONFIG = {
  address: "213.176.77.13",
  port: 443,
  protocol: "vless" as const,
  network: "ws",
  path: "/api",
  security: "none",
  uuid: "f9c45ccd-abb2-4a59-96bc-ea48459fd38b",
};

let sessionCookie: string | null = null;

async function loginPanel(): Promise<string> {
  const res = await fetch(`${PANEL_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `username=${USERNAME}&password=${PASSWORD}`,
    redirect: "manual",
  });

  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) throw new Error("Login failed: no cookie");
  sessionCookie = setCookie;
  return sessionCookie;
}

async function getSession(): Promise<string> {
  if (!sessionCookie) return await loginPanel();
  return sessionCookie;
}

async function apiGet(path: string): Promise<any> {
  const cookie = await getSession();
  let res = await fetch(`${PANEL_BASE}${path}`, {
    headers: { Cookie: cookie },
  });

  if (res.status === 401 || res.status === 403) {
    sessionCookie = null;
    const newCookie = await loginPanel();
    res = await fetch(`${PANEL_BASE}${path}`, {
      headers: { Cookie: newCookie },
    });
  }

  return res.json();
}

async function apiPost(path: string, data: any): Promise<any> {
  const cookie = await getSession();
  let res = await fetch(`${PANEL_BASE}${path}`, {
    method: "POST",
    headers: { Cookie: cookie, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (res.status === 401 || res.status === 403) {
    sessionCookie = null;
    const newCookie = await loginPanel();
    res = await fetch(`${PANEL_BASE}${path}`, {
      method: "POST",
      headers: { Cookie: newCookie, "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  return res.json();
}

export async function getInbounds() {
  return apiGet("/panel/api/inbounds/list");
}

export async function getClientTraffic(email: string) {
  return apiGet(`/panel/api/inbounds/getClientTraffics/${email}`);
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
          flow: "",
          limitIp: 0,
          totalGB: 0,
        },
      ],
    }),
  };
  return apiPost("/panel/api/inbounds/addClient", payload);
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
          flow: "",
          limitIp: 0,
          totalGB: 0,
        },
      ],
    }),
  };
  return apiPost(`/panel/api/inbounds/updateClient/${uuid}`, payload);
}

export async function deleteClient(email: string) {
  const inbounds = await getInbounds();
  const inbound = inbounds?.obj?.find((i: any) => i.id === INBOUND_ID);
  if (!inbound) throw new Error("Inbound not found");
  const settings = JSON.parse(inbound.settings || "{}");
  const client = settings.clients?.find((c: any) => c.email === email);
  if (!client) return { success: true };
  return apiPost(`/panel/api/inbounds/${INBOUND_ID}/delClient/${client.id}`, {});
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
