"use client";

import { useState } from "react";
import {
  Search,
  Zap,
  CheckCircle,
  Star,
  Globe,
} from "lucide-react";

interface Server {
  id: string;
  country: string;
  city: string;
  flag: string;
  ping: number;
  protocol: string;
  load: number;
  premium: boolean;
}

const ALL_SERVERS: Server[] = [
  { id: "1", country: "Германия", city: "Франкфурт", flag: "🇩🇪", ping: 24, protocol: "VLESS", load: 35, premium: false },
  { id: "2", country: "США", city: "Нью-Йорк", flag: "🇺🇸", ping: 88, protocol: "Trojan", load: 62, premium: false },
  { id: "3", country: "Нидерланды", city: "Амстердам", flag: "🇳🇱", ping: 31, protocol: "VLESS", load: 18, premium: false },
  { id: "4", country: "Япония", city: "Токио", flag: "🇯🇵", ping: 145, protocol: "Hysteria2", load: 44, premium: true },
  { id: "5", country: "Сингапур", city: "Сингапур", flag: "🇸🇬", ping: 172, protocol: "VLESS", load: 28, premium: true },
  { id: "6", country: "Великобритания", city: "Лондон", flag: "🇬🇧", ping: 56, protocol: "Trojan", load: 71, premium: false },
  { id: "7", country: "Франция", city: "Париж", flag: "🇫🇷", ping: 42, protocol: "VLESS", load: 22, premium: false },
  { id: "8", country: "Швеция", city: "Стокгольм", flag: "🇸🇪", ping: 38, protocol: "VLESS", load: 15, premium: false },
  { id: "9", country: "Австралия", city: "Сидней", flag: "🇦🇺", ping: 210, protocol: "Hysteria2", load: 33, premium: true },
  { id: "10", country: "Канада", city: "Торонто", flag: "🇨🇦", ping: 102, protocol: "Trojan", load: 48, premium: false },
];

function getPingColor(ping: number) {
  if (ping < 50) return "var(--primary)";
  if (ping < 120) return "var(--accent)";
  return "var(--destructive)";
}

function getLoadColor(load: number) {
  if (load < 40) return "var(--primary)";
  if (load < 70) return "var(--accent)";
  return "var(--destructive)";
}

export function ServersScreen() {
  const [selected, setSelected] = useState("1");
  const [favorites, setFavorites] = useState<string[]>(["1"]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "favorites">("all");

  const filtered = ALL_SERVERS.filter((s) => {
    const q = search.toLowerCase();
    const match =
      s.country.toLowerCase().includes(q) || s.city.toLowerCase().includes(q);
    if (filter === "favorites") return match && favorites.includes(s.id);
    return match;
  });

  const toggleFav = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex flex-col gap-3 px-5 pb-6 pt-3">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <Globe className="h-[22px] w-[22px]" style={{ color: "var(--primary)" }} />
        <h2
          className="flex-1 text-[22px] font-extrabold"
          style={{ color: "var(--foreground)" }}
        >
          Серверы
        </h2>
        <span className="text-[13px] font-semibold" style={{ color: "var(--muted)" }}>
          {ALL_SERVERS.length} серверов
        </span>
      </div>

      {/* Search */}
      <div
        className="flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5"
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--card-border)",
        }}
      >
        <Search className="h-4 w-4 shrink-0" style={{ color: "var(--muted)" }} />
        <input
          type="text"
          placeholder="Поиск по стране или городу..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent text-sm outline-none"
          style={{ color: "var(--foreground)" }}
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["all", "favorites"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors"
            style={{
              backgroundColor:
                filter === f ? "rgba(20, 214, 160, 0.15)" : "var(--card)",
              borderColor:
                filter === f ? "var(--primary)" : "var(--card-border)",
              color: filter === f ? "var(--primary)" : "var(--muted)",
            }}
          >
            {f === "all" ? "Все" : "Избранные"}
          </button>
        ))}
      </div>

      {/* Server list */}
      <div className="flex flex-col gap-2.5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 pt-16">
            <Globe className="h-10 w-10" style={{ color: "var(--muted)" }} />
            <span className="text-[15px] font-semibold" style={{ color: "var(--muted)" }}>
              Серверы не найдены
            </span>
          </div>
        ) : (
          filtered.map((server) => {
            const isSelected = server.id === selected;
            const isFav = favorites.includes(server.id);
            const pingColor = getPingColor(server.ping);
            const loadColor = getLoadColor(server.load);

            return (
              <button
                key={server.id}
                onClick={() => setSelected(server.id)}
                className="flex items-center justify-between rounded-2xl border p-3.5 text-left transition-colors"
                style={{
                  backgroundColor: isSelected
                    ? "rgba(20, 214, 160, 0.05)"
                    : "var(--card)",
                  borderColor: isSelected
                    ? "var(--primary)"
                    : "var(--card-border)",
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-[30px] leading-none">{server.flag}</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-[15px] font-bold"
                        style={{ color: "var(--foreground)" }}
                      >
                        {server.country}
                      </span>
                      {server.premium && (
                        <span
                          className="rounded px-1.5 py-0.5 text-[9px] font-extrabold"
                          style={{
                            backgroundColor: "rgba(245, 158, 11, 0.2)",
                            color: "var(--accent)",
                          }}
                        >
                          PRO
                        </span>
                      )}
                    </div>
                    <div className="text-xs" style={{ color: "var(--muted)" }}>
                      {server.city}
                    </div>
                    <div
                      className="mt-0.5 text-[11px] font-semibold"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {server.protocol}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3" style={{ color: pingColor }} />
                    <span className="text-xs font-bold" style={{ color: pingColor }}>
                      {server.ping} мс
                    </span>
                  </div>
                  <div
                    className="h-1 w-[60px] overflow-hidden rounded-sm"
                    style={{ backgroundColor: "var(--card-border)" }}
                  >
                    <div
                      className="h-full rounded-sm"
                      style={{
                        width: `${server.load}%`,
                        backgroundColor: loadColor,
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold" style={{ color: loadColor }}>
                    {server.load}%
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFav(server.id);
                      }}
                      className="p-0.5"
                      aria-label={isFav ? "Убрать из избранного" : "Добавить в избранное"}
                    >
                      <Star
                        className="h-[18px] w-[18px]"
                        style={{
                          color: isFav ? "var(--accent)" : "var(--muted)",
                        }}
                        fill={isFav ? "var(--accent)" : "none"}
                      />
                    </button>
                    {isSelected && (
                      <CheckCircle
                        className="h-5 w-5"
                        style={{ color: "var(--primary)" }}
                      />
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
