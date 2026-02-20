"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  ChevronRight,
  Zap,
  ArrowDown,
  ArrowUp,
  CreditCard,
  Loader2,
  Wifi,
  Lock,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  connectVPN,
  disconnectVPN,
  fetchTraffic,
  fetchVPNStatus,
  formatBytes,
  formatTime,
} from "@/lib/api";

const SERVER = {
  country: "Германия",
  city: "Франкфурт",
  flag: "DE",
  protocol: "VLESS",
};

export function VPNDashboard({
  onNavigate,
}: {
  onNavigate: (page: string) => void;
}) {
  const { subscription } = useAuth();
  const hasSubscription = subscription?.active || false;
  const isTrial = hasSubscription && subscription?.plan === "trial";
  const trialDaysLeft = isTrial && subscription?.expiresAt
    ? Math.max(0, Math.ceil((subscription.expiresAt - Date.now() / 1000) / 86400))
    : 0;

  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [ping, setPing] = useState<number | null>(null);
  const [traffic, setTraffic] = useState({ down: 0, up: 0 });
  const [serverIp, setServerIp] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer for connection duration
  useEffect(() => {
    if (connected) {
      timerRef.current = setInterval(
        () => setElapsedSeconds((s) => s + 1),
        1000
      );
    } else {
      setElapsedSeconds(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [connected]);

  // Poll traffic when connected
  useEffect(() => {
    if (!connected) return;
    const poll = async () => {
      try {
        const data = await fetchTraffic();
        if (data?.success && data.client) {
          setTraffic({ down: data.client.down || 0, up: data.client.up || 0 });
        }
      } catch {
        /* ignore */
      }
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [connected]);

  // Check server status on mount
  useEffect(() => {
    const check = async () => {
      try {
        const data = await fetchVPNStatus();
        if (data?.success) setPing(data.ping ?? null);
      } catch {
        /* ignore */
      }
    };
    check();
  }, []);

  const handleToggle = useCallback(async () => {
    if (!hasSubscription) {
      onNavigate("subscription");
      return;
    }

    if (connected) {
      try {
        await disconnectVPN();
      } catch {
        /* ignore */
      }
      setConnected(false);
      setTraffic({ down: 0, up: 0 });
      setVlessUrl(null);
    } else {
      setConnecting(true);
      try {
        const data = await connectVPN();
        if (data?.success) {
          setVlessUrl(data.config?.vlessUrl || null);
          setConnected(true);
        } else if (data?.needSubscription) {
          onNavigate("subscription");
        }
      } catch {
        /* ignore */
      } finally {
        setConnecting(false);
      }
    }
  }, [connected, hasSubscription, onNavigate]);

  const handleCopy = async () => {
    if (vlessUrl) {
      await navigator.clipboard.writeText(vlessUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const statusColor = connected
    ? "var(--primary)"
    : connecting
      ? "var(--accent)"
      : "var(--muted)";
  const statusText = connected
    ? "ПОДКЛЮЧЕНО"
    : connecting
      ? "ПОДКЛЮЧЕНИЕ..."
      : "НЕ ПОДКЛЮЧЕНО";

  return (
    <div className="flex flex-col gap-5 px-5 pb-6 pt-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6" style={{ color: "var(--primary)" }} />
          <span
            className="text-xl font-extrabold tracking-wide"
            style={{ color: "var(--foreground)" }}
          >
            SMG VPN
          </span>
        </div>
        <div
          className="flex items-center gap-1.5 rounded-full border px-2.5 py-1"
          style={{ borderColor: statusColor }}
        >
          <div
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: statusColor }}
          />
          <span
            className="text-[11px] font-bold tracking-wide"
            style={{ color: statusColor }}
          >
            {statusText}
          </span>
        </div>
      </div>

      {/* Trial banner */}
      {isTrial && (
        <button
          onClick={() => onNavigate("subscription")}
          className="flex items-center gap-3 rounded-2xl border p-4 text-left transition-opacity hover:opacity-90"
          style={{
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            borderColor: "rgba(59, 130, 246, 0.3)",
          }}
        >
          <Zap
            className="h-6 w-6 shrink-0"
            style={{ color: "#3b82f6" }}
          />
          <div className="flex-1">
            <div
              className="text-[15px] font-bold"
              style={{ color: "#3b82f6" }}
            >
              {"Пробный период \u2014 "}
              {trialDaysLeft > 0
                ? `${trialDaysLeft} ${trialDaysLeft === 1 ? "день" : "дня"}`
                : "истекает сегодня"}
            </div>
            <div className="text-[13px]" style={{ color: "var(--muted-foreground)" }}>
              Оформите подписку для продолжения
            </div>
          </div>
          <ChevronRight
            className="h-5 w-5 shrink-0"
            style={{ color: "#3b82f6" }}
          />
        </button>
      )}

      {/* Subscription banner */}
      {!hasSubscription && !isTrial && (
        <button
          onClick={() => onNavigate("subscription")}
          className="flex items-center gap-3 rounded-2xl border p-4 text-left transition-opacity hover:opacity-90"
          style={{
            backgroundColor: "rgba(245, 158, 11, 0.1)",
            borderColor: "rgba(245, 158, 11, 0.3)",
          }}
        >
          <CreditCard
            className="h-6 w-6 shrink-0"
            style={{ color: "var(--accent)" }}
          />
          <div className="flex-1">
            <div
              className="text-[15px] font-bold"
              style={{ color: "var(--accent)" }}
            >
              Активируйте подписку
            </div>
            <div className="text-[13px]" style={{ color: "var(--muted-foreground)" }}>
              Для подключения к VPN нужна активная подписка
            </div>
          </div>
          <ChevronRight
            className="h-5 w-5 shrink-0"
            style={{ color: "var(--accent)" }}
          />
        </button>
      )}

      {/* Connect Button */}
      <div className="flex flex-col items-center justify-center py-8">
        <div className="relative">
          {connected && (
            <>
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 animate-ping"
                style={{
                  width: 230,
                  height: 230,
                  borderColor: "var(--primary)",
                  opacity: 0.1,
                  animationDuration: "3s",
                }}
              />
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  width: 250,
                  height: 250,
                  backgroundColor: "rgba(20, 214, 160, 0.08)",
                }}
              />
            </>
          )}

          <button
            onClick={handleToggle}
            className="relative z-10 flex flex-col items-center justify-center gap-2 rounded-full border-[3px] transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              width: 170,
              height: 170,
              backgroundColor: connected ? "var(--primary)" : "var(--card)",
              borderColor: connected
                ? "#0fb88a"
                : connecting
                  ? "var(--accent)"
                  : "var(--card-border)",
              boxShadow: connected
                ? "0 0 60px rgba(20, 214, 160, 0.3)"
                : "none",
            }}
          >
            {connected ? (
              <ShieldCheck
                className="h-[52px] w-[52px]"
                style={{ color: "var(--primary-foreground)" }}
              />
            ) : connecting ? (
              <Loader2
                className="h-[52px] w-[52px] animate-spin"
                style={{ color: "var(--accent)" }}
              />
            ) : (
              <ShieldOff className="h-[52px] w-[52px]" style={{ color: "var(--muted)" }} />
            )}
            <span
              className="text-[11px] font-extrabold tracking-[1.5px]"
              style={{
                color: connected
                  ? "var(--primary-foreground)"
                  : connecting
                    ? "var(--accent)"
                    : "var(--muted-foreground)",
              }}
            >
              {connected
                ? "ОТКЛЮЧИТЬ"
                : connecting
                  ? "ПОДКЛЮЧЕНИЕ..."
                  : "ПОДКЛЮЧИТЬ"}
            </span>
          </button>
        </div>
      </div>

      {/* Timer */}
      <div
        className="text-center text-[15px] font-semibold tracking-[3px]"
        style={{ color: "var(--muted-foreground)" }}
      >
        {formatTime(elapsedSeconds)}
      </div>

      {/* Server card */}
      <button
        onClick={() => onNavigate("servers")}
        className="flex items-center justify-between rounded-2xl border p-4 text-left transition-colors hover:opacity-90"
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--card-border)",
        }}
      >
        <div className="flex items-center gap-3.5">
          <span className="text-[32px] leading-none" aria-label={`Флаг ${SERVER.country}`}>
            {"🇩🇪"}
          </span>
          <div>
            <div
              className="text-base font-bold"
              style={{ color: "var(--foreground)" }}
            >
              {SERVER.country}
            </div>
            <div className="text-[13px]" style={{ color: "var(--muted)" }}>
              {SERVER.city}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {ping !== null && (
            <div
              className="flex items-center gap-1 rounded-lg px-2 py-1"
              style={{ backgroundColor: "rgba(20, 214, 160, 0.12)" }}
            >
              <Zap className="h-3 w-3" style={{ color: "var(--primary)" }} />
              <span
                className="text-xs font-semibold"
                style={{ color: "var(--primary)" }}
              >
                {ping} мс
              </span>
            </div>
          )}
          <span
            className="rounded-md px-2 py-1 text-[11px] font-semibold"
            style={{
              backgroundColor: "var(--card-border)",
              color: "var(--muted-foreground)",
            }}
          >
            {SERVER.protocol}
          </span>
          <ChevronRight className="h-[18px] w-[18px]" style={{ color: "var(--muted)" }} />
        </div>
      </button>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2.5">
        <div
          className="flex flex-col items-center gap-1.5 rounded-[var(--radius)] border p-3.5"
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--card-border)",
          }}
        >
          <ArrowDown className="h-5 w-5" style={{ color: "var(--primary)" }} />
          <span className="text-[11px] font-semibold" style={{ color: "var(--muted)" }}>
            Скачано
          </span>
          <span
            className="text-[13px] font-bold"
            style={{ color: "var(--foreground)" }}
          >
            {formatBytes(traffic.down)}
          </span>
        </div>
        <div
          className="flex flex-col items-center gap-1.5 rounded-[var(--radius)] border p-3.5"
          style={{
            backgroundColor: "var(--card)",
            borderColor: "rgba(20, 214, 160, 0.2)",
          }}
        >
          <Zap className="h-5 w-5" style={{ color: "var(--primary)" }} />
          <span className="text-[11px] font-semibold" style={{ color: "var(--muted)" }}>
            Сессия
          </span>
          <span
            className="text-[13px] font-bold"
            style={{ color: "var(--foreground)" }}
          >
            {formatTime(elapsedSeconds)}
          </span>
        </div>
        <div
          className="flex flex-col items-center gap-1.5 rounded-[var(--radius)] border p-3.5"
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--card-border)",
          }}
        >
          <ArrowUp className="h-5 w-5" style={{ color: "#3b82f6" }} />
          <span className="text-[11px] font-semibold" style={{ color: "var(--muted)" }}>
            Загружено
          </span>
          <span
            className="text-[13px] font-bold"
            style={{ color: "var(--foreground)" }}
          >
            {formatBytes(traffic.up)}
          </span>
        </div>
      </div>

      {/* VLESS config card */}
      {connected && vlessUrl && (
        <div
          className="flex flex-col gap-2 rounded-[var(--radius)] border p-3.5"
          style={{
            backgroundColor: "var(--card)",
            borderColor: "rgba(20, 214, 160, 0.3)",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" style={{ color: "var(--primary)" }} />
              <span
                className="text-[13px] font-bold"
                style={{ color: "var(--primary)" }}
              >
                VLESS конфигурация
              </span>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors"
              style={{
                backgroundColor: "rgba(20, 214, 160, 0.1)",
                color: "var(--primary)",
              }}
            >
              {copied ? (
                <Check className="h-3 w-3" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              {copied ? "Скопировано" : "Копировать"}
            </button>
          </div>
          <div
            className="truncate rounded-lg p-2 font-mono text-[11px]"
            style={{
              backgroundColor: "#060b18",
              color: "var(--muted-foreground)",
            }}
          >
            {vlessUrl}
          </div>
          <span className="text-[11px]" style={{ color: "var(--muted)" }}>
            Скопируйте ссылку в v2rayNG / NekoBox для подключения
          </span>
        </div>
      )}

      {/* Info card */}
      <div
        className="flex items-center gap-2.5 rounded-[var(--radius)] border p-3.5"
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--card-border)",
        }}
      >
        <ShieldCheck
          className="h-5 w-5 shrink-0"
          style={{
            color: connected ? "var(--primary)" : "var(--muted)",
          }}
        />
        <span
          className="text-[13px] font-medium"
          style={{
            color: connected ? "var(--primary)" : "var(--muted)",
          }}
        >
          {connected
            ? "Подключено к серверу: 213.176.77.13 (Франкфурт)"
            : hasSubscription
              ? "Нажмите кнопку для подключения к VPN"
              : "Оформите подписку для подключения к VPN"}
        </span>
      </div>
    </div>
  );
}
