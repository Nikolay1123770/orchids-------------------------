"use client";

import { useState, useEffect } from "react";
import {
  BarChart2,
  ArrowDown,
  ArrowUp,
  Zap,
  Globe,
  Calendar,
  Loader2,
} from "lucide-react";
import { fetchTraffic, fetchVPNStatus, formatBytes } from "@/lib/api";

const CHART_DATA = [12, 28, 45, 38, 55, 42, 60, 48, 35, 52, 40, 24];
const CHART_LABELS = ["09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20"];
const CHART_MAX = Math.max(...CHART_DATA);
const CHART_HEIGHT = 100;

export function StatsScreen() {
  const [period, setPeriod] = useState<"today" | "week" | "month">("today");
  const [loading, setLoading] = useState(true);
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);
  const [ping, setPing] = useState<number | null>(null);
  const [traffic, setTraffic] = useState({ down: 0, up: 0, total: 0 });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [statusData, trafficData] = await Promise.all([
          fetchVPNStatus(),
          fetchTraffic(),
        ]);
        if (statusData?.success) {
          setServerOnline(statusData.online ?? false);
          setPing(statusData.ping ?? null);
        }
        if (trafficData?.success && trafficData.client) {
          const down = trafficData.client.down || 0;
          const up = trafficData.client.up || 0;
          setTraffic({ down, up, total: down + up });
        }
      } catch {
        setServerOnline(false);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="flex flex-col gap-4 px-5 pb-6 pt-3">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <BarChart2 className="h-[22px] w-[22px]" style={{ color: "var(--primary)" }} />
        <h2
          className="flex-1 text-[22px] font-extrabold"
          style={{ color: "var(--foreground)" }}
        >
          Статистика
        </h2>
        {loading && <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--primary)" }} />}
      </div>

      {/* Server status */}
      <div
        className="flex flex-col gap-2.5 rounded-2xl border p-4"
        style={{
          backgroundColor: "var(--card)",
          borderColor: serverOnline
            ? "rgba(20, 214, 160, 0.3)"
            : "rgba(239, 68, 68, 0.3)",
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="h-2 w-2 rounded-full"
            style={{
              backgroundColor: serverOnline ? "var(--primary)" : "var(--destructive)",
            }}
          />
          <span
            className="text-[15px] font-bold"
            style={{ color: "var(--foreground)" }}
          >
            {serverOnline === null
              ? "Проверка сервера..."
              : serverOnline
                ? "Сервер онлайн"
                : "Сервер недоступен"}
          </span>
        </div>
        <div className="flex gap-5">
          <div>
            <div className="text-[11px] font-semibold" style={{ color: "var(--muted)" }}>
              Адрес
            </div>
            <div className="text-[13px] font-bold" style={{ color: "var(--foreground)" }}>
              213.176.77.13:443
            </div>
          </div>
          {ping !== null && (
            <div>
              <div className="text-[11px] font-semibold" style={{ color: "var(--muted)" }}>
                Пинг
              </div>
              <div className="text-[13px] font-bold" style={{ color: "var(--primary)" }}>
                {ping} мс
              </div>
            </div>
          )}
        </div>
        <div className="text-xs" style={{ color: "var(--muted)" }}>
          {"🇩🇪"} Франкфурт, Германия - VLESS WebSocket
        </div>
      </div>

      {/* Period selector */}
      <div
        className="flex rounded-xl border p-1"
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--card-border)",
        }}
      >
        {(["today", "week", "month"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className="flex-1 rounded-lg py-2 text-center text-[13px] font-semibold transition-colors"
            style={{
              backgroundColor:
                period === p ? "rgba(20, 214, 160, 0.15)" : "transparent",
              color: period === p ? "var(--primary)" : "var(--muted)",
            }}
          >
            {p === "today" ? "Сегодня" : p === "week" ? "Неделя" : "Месяц"}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="flex flex-col gap-1.5 rounded-[var(--radius)] border p-3.5"
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--card-border)",
          }}
        >
          <div
            className="flex h-9 w-9 items-center justify-center rounded-[10px]"
            style={{ backgroundColor: "rgba(20, 214, 160, 0.15)" }}
          >
            <ArrowDown className="h-[18px] w-[18px]" style={{ color: "var(--primary)" }} />
          </div>
          <span className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
            Скачано
          </span>
          <span
            className="text-lg font-extrabold"
            style={{ color: "var(--foreground)" }}
          >
            {formatBytes(traffic.down)}
          </span>
        </div>

        <div
          className="flex flex-col gap-1.5 rounded-[var(--radius)] border p-3.5"
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--card-border)",
          }}
        >
          <div
            className="flex h-9 w-9 items-center justify-center rounded-[10px]"
            style={{ backgroundColor: "rgba(59, 130, 246, 0.15)" }}
          >
            <ArrowUp className="h-[18px] w-[18px]" style={{ color: "#3b82f6" }} />
          </div>
          <span className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
            Загружено
          </span>
          <span
            className="text-lg font-extrabold"
            style={{ color: "var(--foreground)" }}
          >
            {formatBytes(traffic.up)}
          </span>
        </div>

        <div
          className="flex flex-col gap-1.5 rounded-[var(--radius)] border p-3.5"
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--card-border)",
          }}
        >
          <div
            className="flex h-9 w-9 items-center justify-center rounded-[10px]"
            style={{ backgroundColor: "rgba(168, 85, 247, 0.15)" }}
          >
            <Globe className="h-[18px] w-[18px]" style={{ color: "#a855f7" }} />
          </div>
          <span className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
            Всего трафика
          </span>
          <span
            className="text-lg font-extrabold"
            style={{ color: "var(--foreground)" }}
          >
            {formatBytes(traffic.total)}
          </span>
        </div>

        <div
          className="flex flex-col gap-1.5 rounded-[var(--radius)] border p-3.5"
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--card-border)",
          }}
        >
          <div
            className="flex h-9 w-9 items-center justify-center rounded-[10px]"
            style={{ backgroundColor: "rgba(245, 158, 11, 0.15)" }}
          >
            <Zap className="h-[18px] w-[18px]" style={{ color: "var(--accent)" }} />
          </div>
          <span className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
            Протокол
          </span>
          <span
            className="text-lg font-extrabold"
            style={{ color: "var(--foreground)" }}
          >
            VLESS WS
          </span>
        </div>
      </div>

      {/* Chart */}
      <div
        className="rounded-2xl border p-4"
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--card-border)",
        }}
      >
        <div
          className="mb-4 text-[13px] font-semibold"
          style={{ color: "var(--muted-foreground)" }}
        >
          {"Активность (МБ/с)"}
        </div>
        <div className="flex items-end gap-1" style={{ height: CHART_HEIGHT + 30 }}>
          {CHART_DATA.map((val, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className="w-full rounded"
                style={{
                  height: (val / CHART_MAX) * CHART_HEIGHT,
                  minHeight: 4,
                  backgroundColor:
                    i === CHART_DATA.length - 3
                      ? "var(--primary)"
                      : "rgba(20, 214, 160, 0.3)",
                }}
              />
              <span className="text-[9px] font-semibold" style={{ color: "var(--muted)" }}>
                {CHART_LABELS[i]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Server info */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" style={{ color: "var(--muted)" }} />
          <span
            className="text-sm font-bold"
            style={{ color: "var(--muted-foreground)" }}
          >
            Информация о сервере
          </span>
        </div>
        {[
          { label: "IP", value: "213.176.77.13" },
          { label: "Порт", value: "443" },
          { label: "Протокол", value: "VLESS" },
          { label: "Транспорт", value: "WebSocket (/api)" },
          { label: "Расположение", value: "Франкфурт, Германия" },
          { label: "Провайдер", value: "AMD EPYC - 2.5 Гбит/с" },
        ].map((item, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-xl border px-3.5 py-3"
            style={{
              backgroundColor: "var(--card)",
              borderColor: "var(--card-border)",
            }}
          >
            <span className="text-[13px] font-semibold" style={{ color: "var(--muted)" }}>
              {item.label}
            </span>
            <span
              className="text-[13px] font-bold"
              style={{ color: "var(--foreground)" }}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
