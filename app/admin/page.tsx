"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  CreditCard,
  Shield,
  BarChart2,
  RefreshCw,
  Trash2,
  Ban,
  Gift,
  LogIn,
  Loader2,
  ChevronDown,
  Search,
} from "lucide-react";

interface Stats {
  totalUsers: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  paidSubscriptions: number;
  totalPayments: number;
  confirmedPayments: number;
  totalRevenue: number;
}

interface UserData {
  id: number;
  email: string;
  uuid: string;
  xuiEmail: string;
  createdAt: number;
  subscription: {
    plan: string;
    expiresAt: number;
    active: boolean;
    isTrial: boolean;
  } | null;
  totalSubscriptions: number;
}

interface PaymentData {
  id: number;
  userId: number;
  userEmail: string;
  plan: string;
  amount: number;
  label: string;
  status: string;
  yoomoneyOpid: string | null;
  createdAt: number;
  confirmedAt: number | null;
}

type AdminTab = "dashboard" | "users" | "payments";

async function adminFetch<T>(path: string, adminKey: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Key": adminKey,
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function formatDate(ts: number) {
  return new Date(ts * 1000).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function planLabel(plan: string) {
  const map: Record<string, string> = {
    trial: "Пробный (2 дня)",
    "1_month": "1 месяц",
    "3_month": "3 месяца",
    "6_month": "6 месяцев",
    "12_month": "12 месяцев",
  };
  return map[plan] || plan;
}

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [tab, setTab] = useState<AdminTab>("dashboard");
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [grantUserId, setGrantUserId] = useState<number | null>(null);
  const [grantPlan, setGrantPlan] = useState("1_month");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const handleLogin = async () => {
    setLoginError("");
    try {
      const result = await adminFetch<{ success?: boolean; error?: string }>(
        "/api/admin/stats",
        adminKey
      );
      if (result.success) {
        setAuthenticated(true);
      } else {
        setLoginError("Неверный пароль");
      }
    } catch {
      setLoginError("Неверный пароль или ошибка сервера");
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, paymentsRes] = await Promise.all([
        adminFetch<{ success: boolean; stats: Stats }>("/api/admin/stats", adminKey),
        adminFetch<{ success: boolean; users: UserData[] }>("/api/admin/users", adminKey),
        adminFetch<{ success: boolean; payments: PaymentData[] }>("/api/admin/payments", adminKey),
      ]);
      if (statsRes.success) setStats(statsRes.stats);
      if (usersRes.success) setUsers(usersRes.users);
      if (paymentsRes.success) setPayments(paymentsRes.payments);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  useEffect(() => {
    if (authenticated) loadData();
  }, [authenticated, loadData]);

  const handleUserAction = async (action: string, userId: number, plan?: string) => {
    setActionLoading(userId);
    try {
      await adminFetch("/api/admin/users", adminKey, {
        method: "POST",
        body: JSON.stringify({ action, userId, plan }),
      });
      await loadData();
    } catch {
      /* ignore */
    } finally {
      setActionLoading(null);
      setGrantUserId(null);
    }
  };

  // Login screen
  if (!authenticated) {
    return (
      <div
        className="flex min-h-screen items-center justify-center px-4"
        style={{ backgroundColor: "var(--background)" }}
      >
        <div
          className="flex w-full max-w-sm flex-col gap-5 rounded-2xl border p-8"
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--card-border)",
          }}
        >
          <div className="flex flex-col items-center gap-3">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ backgroundColor: "rgba(20, 214, 160, 0.15)" }}
            >
              <Shield className="h-7 w-7" style={{ color: "var(--primary)" }} />
            </div>
            <h1
              className="text-xl font-extrabold"
              style={{ color: "var(--foreground)" }}
            >
              SMG VPN Admin
            </h1>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Введите пароль администратора
            </p>
          </div>

          <input
            type="password"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="Пароль"
            className="rounded-[var(--radius)] border px-4 py-3 text-sm outline-none"
            style={{
              backgroundColor: "var(--background)",
              borderColor: "var(--card-border)",
              color: "var(--foreground)",
            }}
          />

          {loginError && (
            <p className="text-center text-sm" style={{ color: "var(--destructive)" }}>
              {loginError}
            </p>
          )}

          <button
            onClick={handleLogin}
            className="flex items-center justify-center gap-2 rounded-[var(--radius)] py-3 text-sm font-bold"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--primary-foreground)",
            }}
          >
            <LogIn className="h-4 w-4" />
            Войти
          </button>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.uuid.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const TABS: { id: AdminTab; label: string; icon: typeof Users }[] = [
    { id: "dashboard", label: "Обзор", icon: BarChart2 },
    { id: "users", label: "Пользователи", icon: Users },
    { id: "payments", label: "Платежи", icon: CreditCard },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 border-b"
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--card-border)",
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5" style={{ color: "var(--primary)" }} />
            <span className="text-base font-extrabold" style={{ color: "var(--foreground)" }}>
              SMG VPN Admin
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity disabled:opacity-50"
              style={{
                backgroundColor: "rgba(20, 214, 160, 0.1)",
                color: "var(--primary)",
              }}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Обновить
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mx-auto flex max-w-6xl gap-1 px-6 pb-0">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex items-center gap-1.5 rounded-t-lg px-4 py-2.5 text-sm font-semibold transition-colors"
                style={{
                  backgroundColor: isActive ? "var(--background)" : "transparent",
                  color: isActive ? "var(--primary)" : "var(--muted)",
                  borderBottom: isActive ? "2px solid var(--primary)" : "2px solid transparent",
                }}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-6">
        {/* Dashboard tab */}
        {tab === "dashboard" && stats && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard
                label="Пользователи"
                value={stats.totalUsers}
                icon={<Users className="h-5 w-5" />}
                color="var(--primary)"
              />
              <StatCard
                label="Активные подписки"
                value={stats.activeSubscriptions}
                icon={<Shield className="h-5 w-5" />}
                color="#3b82f6"
              />
              <StatCard
                label="Пробный период"
                value={stats.trialSubscriptions}
                icon={<Gift className="h-5 w-5" />}
                color="var(--accent)"
              />
              <StatCard
                label="Доход"
                value={`${stats.totalRevenue} \u20BD`}
                icon={<CreditCard className="h-5 w-5" />}
                color="var(--primary)"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <StatCard
                label="Платные подписки"
                value={stats.paidSubscriptions}
                icon={<Shield className="h-5 w-5" />}
                color="var(--primary)"
              />
              <StatCard
                label="Всего платежей"
                value={stats.totalPayments}
                icon={<CreditCard className="h-5 w-5" />}
                color="var(--muted-foreground)"
              />
              <StatCard
                label="Подтверждённых"
                value={stats.confirmedPayments}
                icon={<CreditCard className="h-5 w-5" />}
                color="var(--primary)"
              />
            </div>
          </div>
        )}

        {tab === "dashboard" && !stats && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--primary)" }} />
          </div>
        )}

        {/* Users tab */}
        {tab === "users" && (
          <div className="flex flex-col gap-4">
            {/* Search */}
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                style={{ color: "var(--muted)" }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по email или UUID..."
                className="w-full rounded-[var(--radius)] border py-2.5 pl-10 pr-4 text-sm outline-none"
                style={{
                  backgroundColor: "var(--card)",
                  borderColor: "var(--card-border)",
                  color: "var(--foreground)",
                }}
              />
            </div>

            <p className="text-sm" style={{ color: "var(--muted)" }}>
              {filteredUsers.length} пользовател{filteredUsers.length === 1 ? "ь" : "ей"}
            </p>

            {/* User cards */}
            <div className="flex flex-col gap-3">
              {filteredUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex flex-col gap-3 rounded-2xl border p-4"
                  style={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--card-border)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-full"
                        style={{ backgroundColor: "rgba(20, 214, 160, 0.15)" }}
                      >
                        <span className="text-sm font-bold" style={{ color: "var(--primary)" }}>
                          {u.email[0]?.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                          {u.email}
                        </div>
                        <div className="text-xs" style={{ color: "var(--muted)" }}>
                          ID: {u.id} | Регистрация: {formatDate(u.createdAt)}
                        </div>
                      </div>
                    </div>

                    {u.subscription ? (
                      <span
                        className="rounded-lg px-2.5 py-1 text-xs font-bold"
                        style={{
                          backgroundColor: u.subscription.isTrial
                            ? "rgba(59, 130, 246, 0.15)"
                            : u.subscription.active
                              ? "rgba(20, 214, 160, 0.15)"
                              : "rgba(239, 68, 68, 0.15)",
                          color: u.subscription.isTrial
                            ? "#3b82f6"
                            : u.subscription.active
                              ? "var(--primary)"
                              : "var(--destructive)",
                        }}
                      >
                        {u.subscription.isTrial
                          ? "Пробный"
                          : u.subscription.active
                            ? planLabel(u.subscription.plan)
                            : "Истёк"}
                      </span>
                    ) : (
                      <span
                        className="rounded-lg px-2.5 py-1 text-xs font-bold"
                        style={{
                          backgroundColor: "rgba(74, 92, 128, 0.2)",
                          color: "var(--muted)",
                        }}
                      >
                        Нет подписки
                      </span>
                    )}
                  </div>

                  {u.subscription && (
                    <div
                      className="rounded-xl px-3 py-2 text-xs"
                      style={{
                        backgroundColor: "var(--background)",
                        color: "var(--muted-foreground)",
                      }}
                    >
                      Подписка до: {formatDate(u.subscription.expiresAt)}
                    </div>
                  )}

                  <div className="flex gap-2">
                    {grantUserId === u.id ? (
                      <div className="flex flex-1 items-center gap-2">
                        <div className="relative flex-1">
                          <select
                            value={grantPlan}
                            onChange={(e) => setGrantPlan(e.target.value)}
                            className="w-full appearance-none rounded-lg border px-3 py-2 pr-8 text-xs outline-none"
                            style={{
                              backgroundColor: "var(--background)",
                              borderColor: "var(--card-border)",
                              color: "var(--foreground)",
                            }}
                          >
                            <option value="trial">Пробный (2 дня)</option>
                            <option value="1_month">1 месяц</option>
                            <option value="3_month">3 месяца</option>
                            <option value="6_month">6 месяцев</option>
                            <option value="12_month">12 месяцев</option>
                          </select>
                          <ChevronDown
                            className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
                            style={{ color: "var(--muted)" }}
                          />
                        </div>
                        <button
                          onClick={() => handleUserAction("grant", u.id, grantPlan)}
                          disabled={actionLoading === u.id}
                          className="rounded-lg px-3 py-2 text-xs font-bold disabled:opacity-50"
                          style={{
                            backgroundColor: "var(--primary)",
                            color: "var(--primary-foreground)",
                          }}
                        >
                          {actionLoading === u.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            "Выдать"
                          )}
                        </button>
                        <button
                          onClick={() => setGrantUserId(null)}
                          className="rounded-lg px-3 py-2 text-xs font-semibold"
                          style={{
                            backgroundColor: "var(--background)",
                            color: "var(--muted-foreground)",
                          }}
                        >
                          Отмена
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => setGrantUserId(u.id)}
                          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold"
                          style={{
                            backgroundColor: "rgba(20, 214, 160, 0.1)",
                            color: "var(--primary)",
                          }}
                        >
                          <Gift className="h-3.5 w-3.5" />
                          Выдать подписку
                        </button>
                        {u.subscription?.active && (
                          <button
                            onClick={() => handleUserAction("deactivate", u.id)}
                            disabled={actionLoading === u.id}
                            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold"
                            style={{
                              backgroundColor: "rgba(245, 158, 11, 0.1)",
                              color: "var(--accent)",
                            }}
                          >
                            <Ban className="h-3.5 w-3.5" />
                            Деактивировать
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm(`Удалить пользователя ${u.email}?`)) {
                              handleUserAction("delete", u.id);
                            }
                          }}
                          disabled={actionLoading === u.id}
                          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold"
                          style={{
                            backgroundColor: "rgba(239, 68, 68, 0.1)",
                            color: "var(--destructive)",
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Удалить
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payments tab */}
        {tab === "payments" && (
          <div className="flex flex-col gap-4">
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              {payments.length} платеж{payments.length === 1 ? "" : "ей"}
            </p>

            <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: "var(--card-border)" }}>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr style={{ backgroundColor: "var(--card)" }}>
                    <th className="px-4 py-3 text-xs font-bold uppercase" style={{ color: "var(--muted)" }}>
                      ID
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase" style={{ color: "var(--muted)" }}>
                      Пользователь
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase" style={{ color: "var(--muted)" }}>
                      План
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase" style={{ color: "var(--muted)" }}>
                      Сумма
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase" style={{ color: "var(--muted)" }}>
                      Статус
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase" style={{ color: "var(--muted)" }}>
                      Дата
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr
                      key={p.id}
                      className="border-t"
                      style={{ borderColor: "var(--card-border)" }}
                    >
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--muted-foreground)" }}>
                        #{p.id}
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--foreground)" }}>
                        {p.userEmail}
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--foreground)" }}>
                        {planLabel(p.plan)}
                      </td>
                      <td className="px-4 py-3 font-bold" style={{ color: "var(--primary)" }}>
                        {p.amount} {"\u20BD"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="rounded-lg px-2 py-1 text-xs font-bold"
                          style={{
                            backgroundColor:
                              p.status === "confirmed"
                                ? "rgba(20, 214, 160, 0.15)"
                                : "rgba(245, 158, 11, 0.15)",
                            color:
                              p.status === "confirmed" ? "var(--primary)" : "var(--accent)",
                          }}
                        >
                          {p.status === "confirmed" ? "Оплачен" : "Ожидание"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
                        {formatDate(p.createdAt)}
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-10 text-center text-sm"
                        style={{ color: "var(--muted)" }}
                      >
                        Платежей пока нет
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div
      className="flex flex-col gap-3 rounded-2xl border p-5"
      style={{
        backgroundColor: "var(--card)",
        borderColor: "var(--card-border)",
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
          {label}
        </span>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`, color }}
        >
          {icon}
        </div>
      </div>
      <span className="text-2xl font-extrabold" style={{ color: "var(--foreground)" }}>
        {value}
      </span>
    </div>
  );
}
