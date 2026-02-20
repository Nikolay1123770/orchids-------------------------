"use client";

import { useState } from "react";
import { Home, Server, BarChart2, Settings } from "lucide-react";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { AuthScreen } from "@/components/auth-screen";
import { VPNDashboard } from "@/components/vpn-dashboard";
import { ServersScreen } from "@/components/servers-screen";
import { StatsScreen } from "@/components/stats-screen";
import { SettingsScreen } from "@/components/settings-screen";
import { SubscriptionScreen } from "@/components/subscription-screen";

type Tab = "home" | "servers" | "stats" | "settings";

const TABS: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Главная", icon: Home },
  { id: "servers", label: "Серверы", icon: Server },
  { id: "stats", label: "Статистика", icon: BarChart2 },
  { id: "settings", label: "Настройки", icon: Settings },
];

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [showSubscription, setShowSubscription] = useState(false);

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: "var(--background)" }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="h-12 w-12 animate-spin rounded-full border-[3px] border-t-transparent"
            style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }}
          />
          <span style={{ color: "var(--muted-foreground)" }}>Загрузка...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  if (showSubscription) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col" style={{ backgroundColor: "var(--background)" }}>
        <div className="flex-1 overflow-y-auto">
          <SubscriptionScreen onBack={() => setShowSubscription(false)} />
        </div>
      </div>
    );
  }

  const handleNavigate = (page: string) => {
    if (page === "subscription") {
      setShowSubscription(true);
    } else if (page === "servers") {
      setActiveTab("servers");
    } else if (page === "stats") {
      setActiveTab("stats");
    } else if (page === "settings") {
      setActiveTab("settings");
    }
  };

  return (
    <div
      className="mx-auto flex min-h-screen max-w-md flex-col"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-[72px]">
        {activeTab === "home" && <VPNDashboard onNavigate={handleNavigate} />}
        {activeTab === "servers" && <ServersScreen />}
        {activeTab === "stats" && <StatsScreen />}
        {activeTab === "settings" && <SettingsScreen />}
      </main>

      {/* Tab bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 border-t"
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--card-border)",
        }}
      >
        <div className="mx-auto flex max-w-md items-center">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex flex-1 flex-col items-center gap-1 pb-2.5 pt-2"
                style={{
                  color: isActive ? "var(--primary)" : "var(--muted)",
                }}
                aria-label={tab.label}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[11px] font-semibold">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default function Page() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
