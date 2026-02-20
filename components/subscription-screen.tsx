"use client";

import { useState, useEffect, useRef } from "react";
import {
  Crown,
  Check,
  ArrowLeft,
  ExternalLink,
  Loader2,
} from "lucide-react";
import {
  fetchPlans,
  createPayment,
  checkPaymentStatus,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface Plan {
  id: string;
  title: string;
  price: number;
  pricePerDay: string;
  badge?: string;
}

export function SubscriptionScreen({
  onBack,
}: {
  onBack: () => void;
}) {
  const { refresh } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState("3_month");
  const [loading, setLoading] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [paymentLabel, setPaymentLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const result = await fetchPlans();
        if (result.success) {
          setPlans(result.plans);
        }
      } catch {
        setError("Не удалось загрузить тарифы");
      } finally {
        setLoadingPlans(false);
      }
    };
    loadPlans();
  }, []);

  // Poll payment status
  useEffect(() => {
    if (!paymentLabel) return;

    const checkStatus = async () => {
      try {
        const result = await checkPaymentStatus(paymentLabel);
        if (result.success && result.status === "confirmed") {
          setPaymentLabel(null);
          if (pollRef.current) clearInterval(pollRef.current);
          await refresh();
          onBack();
        }
      } catch {
        /* ignore */
      }
    };

    pollRef.current = setInterval(checkStatus, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [paymentLabel, refresh, onBack]);

  const handlePurchase = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await createPayment(selectedPlan);
      if (result.success && result.payUrl) {
        setPaymentLabel(result.label || null);
        window.open(result.payUrl, "_blank");
      } else {
        setError(result.message || "Не удалось создать платеж");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Произошла ошибка";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingPlans) {
    return (
      <div
        className="flex min-h-[60vh] flex-col items-center justify-center gap-4"
        style={{ backgroundColor: "var(--background)" }}
      >
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--primary)" }} />
        <span style={{ color: "var(--muted-foreground)" }}>Загрузка тарифов...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 px-5 pb-6 pt-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center"
          aria-label="Назад"
        >
          <ArrowLeft className="h-6 w-6" style={{ color: "var(--foreground)" }} />
        </button>
        <span
          className="text-lg font-bold"
          style={{ color: "var(--foreground)" }}
        >
          Выберите тариф
        </span>
        <div className="w-10" />
      </div>

      {/* Crown */}
      <div className="flex flex-col items-center py-6">
        <div
          className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border-2"
          style={{
            backgroundColor: "rgba(245, 158, 11, 0.15)",
            borderColor: "var(--accent)",
          }}
        >
          <Crown className="h-10 w-10" style={{ color: "var(--accent)" }} />
        </div>
        <h2
          className="mb-2 text-balance text-center text-[28px] font-extrabold"
          style={{ color: "var(--foreground)" }}
        >
          SMG VPN Premium
        </h2>
        <p
          className="text-pretty text-center text-sm"
          style={{ color: "var(--muted-foreground)" }}
        >
          Безлимитный высокоскоростной VPN без ограничений
        </p>
      </div>

      {/* Features */}
      <div
        className="flex flex-col gap-3.5 rounded-2xl border p-5"
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--card-border)",
        }}
      >
        {[
          "Безлимитный трафик",
          "Высокая скорость",
          "Без логов",
          "Защита от утечек DNS",
          "Поддержка 24/7",
        ].map((feature, i) => (
          <div key={i} className="flex items-center gap-3">
            <div
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: "rgba(20, 214, 160, 0.15)" }}
            >
              <Check className="h-4 w-4" style={{ color: "var(--primary)" }} />
            </div>
            <span
              className="text-[15px] font-semibold"
              style={{ color: "var(--foreground)" }}
            >
              {feature}
            </span>
          </div>
        ))}
      </div>

      {/* Plan cards */}
      <div className="flex flex-col gap-3">
        {plans.map((plan) => (
          <button
            key={plan.id}
            onClick={() => setSelectedPlan(plan.id)}
            className="relative flex items-center justify-between rounded-2xl border-2 p-4.5 text-left transition-colors"
            style={{
              backgroundColor:
                selectedPlan === plan.id
                  ? "rgba(20, 214, 160, 0.05)"
                  : "var(--card)",
              borderColor:
                selectedPlan === plan.id
                  ? "var(--primary)"
                  : "var(--card-border)",
            }}
          >
            {plan.badge && (
              <div
                className="absolute -top-2.5 right-4 rounded-lg px-2.5 py-1"
                style={{ backgroundColor: "var(--accent)" }}
              >
                <span
                  className="text-[11px] font-extrabold"
                  style={{ color: "var(--accent-foreground)" }}
                >
                  {plan.badge}
                </span>
              </div>
            )}

            <div>
              <div
                className="text-[17px] font-bold"
                style={{ color: "var(--foreground)" }}
              >
                {plan.title}
              </div>
              <div className="text-[13px]" style={{ color: "var(--muted)" }}>
                {plan.pricePerDay}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className="text-[22px] font-extrabold"
                style={{ color: "var(--primary)" }}
              >
                {plan.price} P
              </span>
              {selectedPlan === plan.id && (
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-full"
                  style={{ backgroundColor: "rgba(20, 214, 160, 0.15)" }}
                >
                  <Check className="h-[18px] w-[18px]" style={{ color: "var(--primary)" }} />
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div
          className="rounded-xl px-4 py-3 text-sm font-medium"
          style={{
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            color: "var(--destructive)",
            border: "1px solid rgba(239, 68, 68, 0.25)",
          }}
        >
          {error}
        </div>
      )}

      {/* Payment waiting */}
      {paymentLabel && (
        <div
          className="flex items-center justify-center gap-3 rounded-xl border p-4"
          style={{
            backgroundColor: "rgba(20, 214, 160, 0.1)",
            borderColor: "rgba(20, 214, 160, 0.3)",
          }}
        >
          <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--primary)" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--primary)" }}>
            Ожидаем подтверждение оплаты...
          </span>
        </div>
      )}

      {/* Purchase button */}
      <button
        onClick={handlePurchase}
        disabled={loading || !!paymentLabel}
        className="flex items-center justify-center gap-2 rounded-[var(--radius)] py-4 text-[17px] font-extrabold transition-opacity disabled:opacity-60"
        style={{
          backgroundColor: "var(--primary)",
          color: "var(--primary-foreground)",
        }}
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            <span>
              Оплатить {plans.find((p) => p.id === selectedPlan)?.price || 0} P
            </span>
            <ExternalLink className="h-[18px] w-[18px]" />
          </>
        )}
      </button>

      <p
        className="text-pretty text-center text-[13px] leading-relaxed"
        style={{ color: "var(--muted)" }}
      >
        После оплаты через ЮMoney подписка активируется автоматически
      </p>
    </div>
  );
}
