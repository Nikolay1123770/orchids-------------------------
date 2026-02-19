import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import {
  createUser,
  getUserByEmail,
  getUserById,
  getActiveSubscription,
  createSubscription,
  createPayment,
  getPaymentByLabel,
  confirmPayment,
} from './db';
import {
  getInbounds,
  getClientTraffic,
  addClient,
  deleteClient,
  getAllTraffic,
  updateClientExpiry,
  VPN_CONFIG,
  INBOUND_ID,
} from './xui';

const app = new Hono();
const JWT_SECRET = process.env.JWT_SECRET || 'smgvpn_secret_2025_$#@!';
const YOOMONEY_TOKEN = process.env.YOOMONEY_TOKEN || '4100118889570559.5471FE93036FACB51259800442ED5D0F29CDED2C77B14C6871BF92A581C1F86ABA3F7E9F4E7C783BB985C11F23553601954C7CBC216A723FBD010627D92285A53E0F2EA68DA75C135BA0EBB318679FF772D2CF6FB9890E70B1E813B29EDF84FC7111B5D72C598E94655E77C679595195E44141B807535C9F23F47074C47A93AD';
const YOOMONEY_WALLET = process.env.YOOMONEY_WALLET || '4100118889570559';
const BACKEND_URL = process.env.BACKEND_URL || 'https://3002-c1addcf3-c7d4-41c8-961b-e54d94780c7d.orchids.cloud';

// Plan durations in seconds
const PLAN_DURATION: Record<string, number> = {
  '1_month':  30 * 24 * 3600,
  '3_month':  90 * 24 * 3600,
  '6_month': 180 * 24 * 3600,
  '12_month': 365 * 24 * 3600,
};

const PRICES: Record<string, number> = {
  '1_month':  50,
  '3_month': 150,
  '6_month': 300,
  '12_month': 600,
};

app.use('*', cors({ credentials: true, origin: (o) => o || '*' }));

// ─── Health ────────────────────────────────────────────────────────────────────
app.get('/', (c) => c.json({ status: 'ok', service: 'SMG VPN API' }));

// ─── Auth middleware ───────────────────────────────────────────────────────────
async function authMiddleware(c: any, next: any) {
  const auth = c.req.header('Authorization');
  if (!auth?.startsWith('Bearer ')) return c.json({ success: false, message: 'Unauthorized' }, 401);
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET) as any;
    c.set('userId', payload.userId);
    await next();
  } catch {
    return c.json({ success: false, message: 'Invalid token' }, 401);
  }
}

// ─── Register ─────────────────────────────────────────────────────────────────
app.post('/api/auth/register', async (c) => {
  try {
    const { email, password } = await c.req.json();
    if (!email || !password) return c.json({ success: false, message: 'Email и пароль обязательны' }, 400);
    if (getUserByEmail(email)) return c.json({ success: false, message: 'Email уже зарегистрирован' }, 409);

    const hashed = await bcrypt.hash(password, 10);
    const uuid = randomUUID();
    // xui_email: short unique string for 3x-ui (max 20 chars)
    const xuiEmail = 'smg_' + randomUUID().replace(/-/g, '').slice(0, 12);

    const user = createUser(email, hashed, uuid, xuiEmail);

    // Create xray client in 3x-ui (no expiry until subscription)
    try {
      await addClient(xuiEmail, uuid, 0, false);
    } catch (_) {
      // might fail if already exists, ignore
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
    return c.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, uuid: user.uuid },
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// ─── Login ────────────────────────────────────────────────────────────────────
app.post('/api/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    const user = getUserByEmail(email);
    if (!user) return c.json({ success: false, message: 'Неверный email или пароль' }, 401);

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return c.json({ success: false, message: 'Неверный email или пароль' }, 401);

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
    const sub = getActiveSubscription(user.id);

    return c.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, uuid: user.uuid },
      subscription: sub
        ? { plan: sub.plan, expiresAt: sub.expires_at, active: sub.active === 1 }
        : null,
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// ─── Me / profile ─────────────────────────────────────────────────────────────
app.get('/api/auth/me', authMiddleware, async (c) => {
  const userId = c.get('userId') as number;
  const user = getUserById(userId);
  if (!user) return c.json({ success: false, message: 'Not found' }, 404);
  const sub = getActiveSubscription(userId);
  return c.json({
    success: true,
    user: { id: user.id, email: user.email, uuid: user.uuid },
    subscription: sub
      ? { plan: sub.plan, expiresAt: sub.expires_at, active: sub.active === 1 }
      : null,
  });
});

// ─── Plans ────────────────────────────────────────────────────────────────────
app.get('/api/plans', (c) =>
  c.json({
    success: true,
    plans: [
      { id: '1_month',  title: '1 месяц',   price: 50,  pricePerDay: '~1.7 ₽/день' },
      { id: '3_month',  title: '3 месяца',  price: 150, pricePerDay: '~1.7 ₽/день', badge: 'Популярный' },
      { id: '6_month',  title: '6 месяцев', price: 300, pricePerDay: '~1.7 ₽/день', badge: 'Выгодно' },
      { id: '12_month', title: '12 месяцев',price: 600, pricePerDay: '~1.6 ₽/день', badge: 'Лучшая цена' },
    ],
  })
);

// ─── Create payment (YooMoney redirect link) ──────────────────────────────────
app.post('/api/payment/create', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId') as number;
    const { plan } = await c.req.json();

    if (!PRICES[plan]) return c.json({ success: false, message: 'Неверный тариф' }, 400);

    const amount = PRICES[plan];
    // Unique label = userId_plan_timestamp
    const label = `smgvpn_${userId}_${plan}_${Date.now()}`;

    createPayment(userId, plan, amount, label);

    // YooMoney QuickPay URL
    const params = new URLSearchParams({
      receiver:         YOOMONEY_WALLET,
      'quickpay-form':  'donate',
      paymentType:      'AC', // bank card
      sum:              String(amount),
      label:            label,
      successURL:       `${BACKEND_URL}/api/payment/success?label=${encodeURIComponent(label)}`,
      comment:          `SMG VPN — ${plan.replace('_', ' ')}`,
    });

    const payUrl = `https://yoomoney.ru/quickpay/confirm.xml?${params.toString()}`;

    return c.json({ success: true, payUrl, label, amount });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// ─── YooMoney webhook (HTTP notification) ────────────────────────────────────
app.post('/api/payment/webhook', async (c) => {
  try {
    const body = await c.req.text();
    const params = new URLSearchParams(body);

    const notification_type  = params.get('notification_type') || '';
    const operation_id       = params.get('operation_id') || '';
    const amount             = params.get('amount') || '';
    const currency           = params.get('currency') || '';
    const datetime           = params.get('datetime') || '';
    const sender             = params.get('sender') || '';
    const codepro            = params.get('codepro') || '';
    const label              = params.get('label') || '';
    const sha1_hash          = params.get('sha1_hash') || '';

    // Verify SHA1 signature
    const str = [notification_type, operation_id, amount, currency, datetime, sender, codepro, YOOMONEY_TOKEN, label].join('&');
    const expected = crypto.createHash('sha1').update(str).digest('hex');

    if (expected !== sha1_hash) {
      console.error('YooMoney webhook: invalid signature');
      return c.text('bad signature', 400);
    }

    const payment = getPaymentByLabel(label);
    if (!payment || payment.status === 'confirmed') return c.text('ok');

    // Verify amount
    if (parseFloat(amount) < PRICES[payment.plan]) {
      console.error('YooMoney webhook: wrong amount', amount, 'expected', PRICES[payment.plan]);
      return c.text('wrong amount', 400);
    }

    // Confirm payment in DB
    confirmPayment(label, operation_id);

    // Activate subscription
    const duration = PLAN_DURATION[payment.plan] || 30 * 24 * 3600;
    const expiresAt = Math.floor(Date.now() / 1000) + duration;
    createSubscription(payment.user_id, payment.plan, expiresAt);

    // Update 3x-ui client expiry
    const user = getUserById(payment.user_id);
    if (user) {
      try {
        await updateClientExpiry(user.xui_email, user.uuid, expiresAt * 1000); // xui uses ms
      } catch (e) {
        console.error('Failed to update xui client:', e);
      }
    }

    console.log(`Payment confirmed: user=${payment.user_id} plan=${payment.plan} opid=${operation_id}`);
    return c.text('ok');
  } catch (err: any) {
    console.error('Webhook error:', err);
    return c.text('error', 500);
  }
});

// ─── Payment success redirect page ───────────────────────────────────────────
app.get('/api/payment/success', (c) => {
  const label = c.req.query('label') || '';
  return c.html(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>SMG VPN — Оплата прошла успешно</title>
      <style>
        body { background: #080e1d; color: #e8f0ff; font-family: sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
        .card { background: #0d1526; border: 1px solid rgba(20,214,160,0.3); border-radius: 20px; padding: 40px; text-align: center; max-width: 360px; }
        .icon { font-size: 56px; }
        h1 { color: #14d6a0; margin: 16px 0 8px; }
        p { color: #8a9bbf; }
        .btn { display: inline-block; margin-top: 24px; background: #14d6a0; color: #080e1d; font-weight: 700; padding: 14px 32px; border-radius: 12px; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon">✅</div>
        <h1>Оплата прошла!</h1>
        <p>Ваша подписка SMG VPN активирована.<br>Вернитесь в приложение.</p>
        <a href="smgvpn://success?label=${encodeURIComponent(label)}" class="btn">Открыть SMG VPN</a>
      </div>
    </body>
    </html>
  `);
});

// ─── Check payment status (polling from app) ──────────────────────────────────
app.get('/api/payment/status', authMiddleware, async (c) => {
  const userId = c.get('userId') as number;
  const label = c.req.query('label') || '';
  const payment = getPaymentByLabel(label);
  if (!payment || payment.user_id !== userId) {
    return c.json({ success: false, message: 'Not found' }, 404);
  }
  return c.json({ success: true, status: payment.status, confirmedAt: payment.confirmed_at });
});

// ─── VPN Connect (requires active subscription) ───────────────────────────────
app.post('/api/vpn/connect', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId') as number;
    const user = getUserById(userId);
    if (!user) return c.json({ success: false, message: 'Пользователь не найден' }, 404);

    const sub = getActiveSubscription(userId);
    if (!sub) {
      return c.json({ success: false, message: 'Нет активной подписки', needSubscription: true }, 403);
    }

    try {
      await updateClientExpiry(user.xui_email, user.uuid, sub.expires_at * 1000);
    } catch (xuiErr) {
      console.error('Failed to sync with 3x-ui:', xuiErr);
    }

    const vlessUrl = `vless://${user.uuid}@${VPN_CONFIG.address}:${VPN_CONFIG.port}?type=${VPN_CONFIG.network}&path=${encodeURIComponent(VPN_CONFIG.path)}&encryption=none&security=none#SMG-VPN-Frankfurt`;

    return c.json({
      success: true,
      message: 'Connected',
      config: {
        ...VPN_CONFIG,
        uuid: user.uuid,
        email: user.xui_email,
        vlessUrl,
        xrayConfig: buildXrayConfig(user.uuid),
      },
      subscription: { plan: sub.plan, expiresAt: sub.expires_at },
    });
  } catch (err: any) {
    console.error('VPN connect error:', err);
    return c.json({ success: false, message: err.message }, 500);
  }
});

// ─── VPN Disconnect ───────────────────────────────────────────────────────────
app.post('/api/vpn/disconnect', authMiddleware, async (c) => {
  return c.json({ success: true, message: 'Disconnected' });
});

// ─── Traffic stats ─────────────────────────────────────────────────────────────
app.get('/api/vpn/traffic', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId') as number;
    const user = getUserById(userId);
    if (!user) return c.json({ success: false, message: 'Not found' }, 404);

    let clientTraffic = { up: 0, down: 0 };
    try {
      const data = await getClientTraffic(user.xui_email);
      if (data?.obj) clientTraffic = { up: data.obj.up || 0, down: data.obj.down || 0 };
    } catch (_) {}

    return c.json({ success: true, client: clientTraffic });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// ─── Server status ─────────────────────────────────────────────────────────────
app.get('/api/vpn/status', async (c) => {
  try {
    const start = Date.now();
    const data = await getInbounds();
    const ping = Date.now() - start;
    const inbound = data?.obj?.find((i: any) => i.id === INBOUND_ID);
    return c.json({
      success: true,
      online: true,
      ping,
      inbound: inbound ? { id: inbound.id, protocol: inbound.protocol, port: inbound.port } : null,
    });
  } catch (err: any) {
    return c.json({ success: false, online: false, message: err.message }, 500);
  }
});

// ─── Server list ───────────────────────────────────────────────────────────────
app.get('/api/servers', (c) =>
  c.json({
    success: true,
    servers: [
      {
        id: '1',
        name: 'Frankfurt #1',
        country: 'Germany',
        city: 'Франкфурт',
        flag: '🇩🇪',
        protocol: 'VLESS',
        transport: 'WebSocket',
        recommended: true,
      },
    ],
  })
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildXrayConfig(uuid: string) {
  return {
    outbounds: [
      {
        protocol: 'vless',
        settings: {
          vnext: [{ address: VPN_CONFIG.address, port: VPN_CONFIG.port, users: [{ id: uuid, encryption: 'none', flow: '' }] }],
        },
        streamSettings: {
          network: 'ws',
          security: 'none',
          wsSettings: { path: VPN_CONFIG.path, headers: {} },
        },
      },
    ],
  };
}

export default { fetch: app.fetch, port: 3002 };
