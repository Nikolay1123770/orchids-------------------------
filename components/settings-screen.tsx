"use client";

import { useState } from "react";
import {
  Settings,
  Shield,
  Bell,
  Zap,
  Globe,
  Lock,
  ChevronRight,
  Info,
  LogOut,
  Wifi,
  Moon,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

type ToggleKey =
  | "autoConnect"
  | "killSwitch"
  | "notifications"
  | "dnsLeak"
  | "splitTunnel"
  | "darkMode";

const PROTOCOL_OPTIONS = ["VLESS", "Trojan", "Hysteria2", "Shadowsocks"];

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="relative h-6 w-11 shrink-0 rounded-full transition-colors"
      style={{
        backgroundColor: checked
          ? "rgba(20, 214, 160, 0.4)"
          : "var(--card-border)",
      }}
    >
      <div
        className="absolute top-0.5 h-5 w-5 rounded-full transition-all"
        style={{
          left: checked ? 22 : 2,
          backgroundColor: checked ? "var(--primary)" : "var(--muted)",
        }}
      />
    </button>
  );
}

export function SettingsScreen() {
  const { user, signOut } = useAuth();
  const [toggles, setToggles] = useState<Record<ToggleKey, boolean>>({
    autoConnect: true,
    killSwitch: true,
    notifications: false,
    dnsLeak: true,
    splitTunnel: false,
    darkMode: true,
  });
  const [protocol, setProtocol] = useState("VLESS");
  const [showProtocols, setShowProtocols] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const toggle = (key: ToggleKey) =>
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="flex flex-col gap-4 px-5 pb-6 pt-3">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <Settings className="h-[22px] w-[22px]" style={{ color: "var(--primary)" }} />
        <h2
          className="text-[22px] font-extrabold"
          style={{ color: "var(--foreground)" }}
        >
          Настройки
        </h2>
      </div>

      {/* Profile card */}
      <div
        className="flex items-center gap-3.5 rounded-2xl border p-4"
        style={{
          backgroundColor: "var(--card)",
          borderColor: "rgba(20, 214, 160, 0.2)",
        }}
      >
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full border-2"
          style={{
            backgroundColor: "rgba(20, 214, 160, 0.2)",
            borderColor: "var(--primary)",
          }}
        >
          <span
            className="text-[22px] font-extrabold"
            style={{ color: "var(--primary)" }}
          >
            {user?.email?.[0]?.toUpperCase() || "S"}
          </span>
        </div>
        <div className="flex-1">
          <div className="text-base font-bold" style={{ color: "var(--foreground)" }}>
            {user?.email || "SMG Premium"}
          </div>
          <div className="text-xs" style={{ color: "var(--primary)" }}>
            Pro план
          </div>
        </div>
        <div
          className="rounded-lg border px-2.5 py-1"
          style={{
            backgroundColor: "rgba(245, 158, 11, 0.2)",
            borderColor: "rgba(245, 158, 11, 0.4)",
          }}
        >
          <span className="text-xs font-extrabold" style={{ color: "var(--accent)" }}>
            PRO
          </span>
        </div>
      </div>

      {/* Connection section */}
      <div>
        <div
          className="mb-2 ml-1 text-xs font-bold uppercase tracking-wider"
          style={{ color: "var(--muted)" }}
        >
          Подключение
        </div>
        <div
          className="overflow-hidden rounded-2xl border"
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--card-border)",
          }}
        >
          <SettingRow
            icon={<Zap className="h-4 w-4" style={{ color: "var(--primary)" }} />}
            iconBg="rgba(20, 214, 160, 0.15)"
            label="Автоподключение"
            description="При запуске приложения"
            right={<Toggle checked={toggles.autoConnect} onChange={() => toggle("autoConnect")} />}
          />
          <Divider />
          <SettingRow
            icon={<Shield className="h-4 w-4" style={{ color: "var(--destructive)" }} />}
            iconBg="rgba(239, 68, 68, 0.15)"
            label="Kill Switch"
            description="Блокировать трафик без VPN"
            right={<Toggle checked={toggles.killSwitch} onChange={() => toggle("killSwitch")} />}
          />
          <Divider />
          <button
            onClick={() => setShowProtocols(!showProtocols)}
            className="w-full"
          >
            <SettingRow
              icon={<Globe className="h-4 w-4" style={{ color: "#a855f7" }} />}
              iconBg="rgba(168, 85, 247, 0.15)"
              label="Протокол"
              description={protocol}
              right={<ChevronRight className="h-[18px] w-[18px]" style={{ color: "var(--muted)" }} />}
            />
          </button>
          {showProtocols && (
            <div className="flex flex-col gap-1.5 px-3.5 pb-2.5">
              {PROTOCOL_OPTIONS.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setProtocol(p);
                    setShowProtocols(false);
                  }}
                  className="flex items-center justify-between rounded-[10px] px-3.5 py-2.5"
                  style={{
                    backgroundColor:
                      protocol === p
                        ? "rgba(20, 214, 160, 0.15)"
                        : "var(--card-border)",
                    border:
                      protocol === p
                        ? "1px solid var(--primary)"
                        : "1px solid transparent",
                  }}
                >
                  <span
                    className="text-sm font-semibold"
                    style={{
                      color: protocol === p ? "var(--primary)" : "var(--muted-foreground)",
                    }}
                  >
                    {p}
                  </span>
                  {protocol === p && (
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: "var(--primary)" }}
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Privacy section */}
      <div>
        <div
          className="mb-2 ml-1 text-xs font-bold uppercase tracking-wider"
          style={{ color: "var(--muted)" }}
        >
          Приватность
        </div>
        <div
          className="overflow-hidden rounded-2xl border"
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--card-border)",
          }}
        >
          <SettingRow
            icon={<Lock className="h-4 w-4" style={{ color: "#3b82f6" }} />}
            iconBg="rgba(59, 130, 246, 0.15)"
            label="Защита от DNS-утечек"
            description="DNS через зашифрованный туннель"
            right={<Toggle checked={toggles.dnsLeak} onChange={() => toggle("dnsLeak")} />}
          />
          <Divider />
          <SettingRow
            icon={<Wifi className="h-4 w-4" style={{ color: "var(--accent)" }} />}
            iconBg="rgba(245, 158, 11, 0.15)"
            label="Раздельное туннелирование"
            description="Выбрать приложения для VPN"
            right={
              <Toggle
                checked={toggles.splitTunnel}
                onChange={() => toggle("splitTunnel")}
              />
            }
          />
        </div>
      </div>

      {/* General section */}
      <div>
        <div
          className="mb-2 ml-1 text-xs font-bold uppercase tracking-wider"
          style={{ color: "var(--muted)" }}
        >
          Общие
        </div>
        <div
          className="overflow-hidden rounded-2xl border"
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--card-border)",
          }}
        >
          <SettingRow
            icon={<Bell className="h-4 w-4" style={{ color: "var(--primary)" }} />}
            iconBg="rgba(20, 214, 160, 0.15)"
            label="Уведомления"
            description="Статус подключения"
            right={
              <Toggle
                checked={toggles.notifications}
                onChange={() => toggle("notifications")}
              />
            }
          />
          <Divider />
          <SettingRow
            icon={<Moon className="h-4 w-4" style={{ color: "#a855f7" }} />}
            iconBg="rgba(168, 85, 247, 0.15)"
            label="Тёмная тема"
            description="Всегда включена"
            right={<Toggle checked={toggles.darkMode} onChange={() => toggle("darkMode")} />}
          />
          <Divider />
          <SettingRow
            icon={<Info className="h-4 w-4" style={{ color: "#8b5cf6" }} />}
            iconBg="rgba(139, 92, 246, 0.15)"
            label="О приложении"
            description="SMG VPN v1.0.0"
            right={<ChevronRight className="h-[18px] w-[18px]" style={{ color: "var(--muted)" }} />}
          />
        </div>
      </div>

      {/* Logout */}
      {showLogoutConfirm ? (
        <div
          className="flex flex-col gap-3 rounded-[var(--radius)] border p-4"
          style={{
            backgroundColor: "rgba(239, 68, 68, 0.05)",
            borderColor: "rgba(239, 68, 68, 0.25)",
          }}
        >
          <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
            Вы уверены, что хотите выйти?
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="flex-1 rounded-xl py-2.5 text-sm font-semibold"
              style={{
                backgroundColor: "var(--card)",
                color: "var(--foreground)",
                border: "1px solid var(--card-border)",
              }}
            >
              Отмена
            </button>
            <button
              onClick={signOut}
              className="flex-1 rounded-xl py-2.5 text-sm font-bold"
              style={{
                backgroundColor: "var(--destructive)",
                color: "var(--foreground)",
              }}
            >
              Выйти
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="flex items-center justify-center gap-2.5 rounded-[var(--radius)] border p-3.5"
          style={{
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            borderColor: "rgba(239, 68, 68, 0.25)",
          }}
        >
          <LogOut className="h-[18px] w-[18px]" style={{ color: "var(--destructive)" }} />
          <span
            className="text-[15px] font-bold"
            style={{ color: "var(--destructive)" }}
          >
            Выйти из аккаунта
          </span>
        </button>
      )}
    </div>
  );
}

function SettingRow({
  icon,
  iconBg,
  label,
  description,
  right,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  description: string;
  right: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between p-3.5">
      <div className="flex items-center gap-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-[10px]"
          style={{ backgroundColor: iconBg }}
        >
          {icon}
        </div>
        <div>
          <div className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
            {label}
          </div>
          <div className="text-xs" style={{ color: "var(--muted)" }}>
            {description}
          </div>
        </div>
      </div>
      {right}
    </div>
  );
}

function Divider() {
  return (
    <div className="mx-3.5 h-px" style={{ backgroundColor: "var(--card-border)" }} />
  );
}
