// In-memory database for Next.js server-side
// This replaces better-sqlite3 with a simple Map-based store

export interface User {
  id: number;
  email: string;
  password: string;
  uuid: string;
  xui_email: string;
  created_at: number;
}

export interface Subscription {
  id: number;
  user_id: number;
  plan: string;
  expires_at: number;
  active: number;
  created_at: number;
}

export interface Payment {
  id: number;
  user_id: number;
  plan: string;
  amount: number;
  label: string;
  status: string;
  yoomoney_opid: string | null;
  created_at: number;
  confirmed_at: number | null;
}

let userIdCounter = 0;
let subIdCounter = 0;
let paymentIdCounter = 0;

const users = new Map<number, User>();
const usersByEmail = new Map<string, User>();
const subscriptions: Subscription[] = [];
const payments = new Map<string, Payment>();

export function createUser(email: string, password: string, uuid: string, xuiEmail: string): User {
  userIdCounter++;
  const user: User = {
    id: userIdCounter,
    email,
    password,
    uuid,
    xui_email: xuiEmail,
    created_at: Math.floor(Date.now() / 1000),
  };
  users.set(user.id, user);
  usersByEmail.set(email, user);
  return user;
}

export function getUserByEmail(email: string): User | undefined {
  return usersByEmail.get(email);
}

export function getUserById(id: number): User | undefined {
  return users.get(id);
}

export function getActiveSubscription(userId: number): Subscription | undefined {
  const now = Math.floor(Date.now() / 1000);
  return subscriptions
    .filter((s) => s.user_id === userId && s.active === 1 && s.expires_at > now)
    .sort((a, b) => b.expires_at - a.expires_at)[0];
}

export function createSubscription(userId: number, plan: string, expiresAt: number) {
  // Deactivate old
  subscriptions.forEach((s) => {
    if (s.user_id === userId) s.active = 0;
  });
  subIdCounter++;
  subscriptions.push({
    id: subIdCounter,
    user_id: userId,
    plan,
    expires_at: expiresAt,
    active: 1,
    created_at: Math.floor(Date.now() / 1000),
  });
}

export function createPayment(userId: number, plan: string, amount: number, label: string) {
  paymentIdCounter++;
  const payment: Payment = {
    id: paymentIdCounter,
    user_id: userId,
    plan,
    amount,
    label,
    status: "pending",
    yoomoney_opid: null,
    created_at: Math.floor(Date.now() / 1000),
    confirmed_at: null,
  };
  payments.set(label, payment);
}

export function getPaymentByLabel(label: string): Payment | undefined {
  return payments.get(label);
}

export function confirmPayment(label: string, opId: string) {
  const p = payments.get(label);
  if (p) {
    p.status = "confirmed";
    p.yoomoney_opid = opId;
    p.confirmed_at = Math.floor(Date.now() / 1000);
  }
}

export function getPendingPaymentsForUser(userId: number): Payment[] {
  const result: Payment[] = [];
  payments.forEach((p) => {
    if (p.user_id === userId && p.status === "pending") {
      result.push(p);
    }
  });
  return result.sort((a, b) => b.created_at - a.created_at).slice(0, 10);
}
