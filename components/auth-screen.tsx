"use client";

import { useState } from "react";
import { Shield, Mail, Lock, Loader2 } from "lucide-react";
import { login, register } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refresh } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Заполните все поля");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = isLogin
        ? await login(email, password)
        : await register(email, password);

      if (result.success) {
        await refresh();
      } else {
        setError(result.message || "Произошла ошибка");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Не удалось подключиться к серверу";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6" style={{ backgroundColor: "var(--background)" }}>
      <div className="w-full max-w-sm">
        <div className="mb-12 flex flex-col items-center">
          <div
            className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border-2"
            style={{
              backgroundColor: "rgba(20, 214, 160, 0.15)",
              borderColor: "var(--primary)",
            }}
          >
            <Shield className="h-10 w-10" style={{ color: "var(--primary)" }} />
          </div>
          <h1 className="mb-2 text-3xl font-extrabold" style={{ color: "var(--foreground)" }}>
            SMG VPN
          </h1>
          <p style={{ color: "var(--muted-foreground)" }}>
            {isLogin ? "Войдите в свой аккаунт" : "Создайте аккаунт"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

          <div
            className="flex items-center gap-3 rounded-[var(--radius)] border px-4 py-3.5"
            style={{
              backgroundColor: "var(--card)",
              borderColor: "var(--card-border)",
            }}
          >
            <Mail className="h-5 w-5 shrink-0" style={{ color: "var(--muted)" }} />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent text-base outline-none"
              style={{ color: "var(--foreground)" }}
              autoComplete="email"
            />
          </div>

          <div
            className="flex items-center gap-3 rounded-[var(--radius)] border px-4 py-3.5"
            style={{
              backgroundColor: "var(--card)",
              borderColor: "var(--card-border)",
            }}
          >
            <Lock className="h-5 w-5 shrink-0" style={{ color: "var(--muted)" }} />
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent text-base outline-none"
              style={{ color: "var(--foreground)" }}
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex items-center justify-center rounded-[var(--radius)] py-4 text-base font-bold transition-opacity disabled:opacity-60"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--primary-foreground)",
            }}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isLogin ? (
              "Войти"
            ) : (
              "Зарегистрироваться"
            )}
          </button>

          <button
            type="button"
            className="py-3 text-center text-sm"
            style={{ color: "var(--muted-foreground)" }}
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
          >
            {isLogin ? "Нет аккаунта? " : "Уже есть аккаунт? "}
            <span className="font-bold" style={{ color: "var(--primary)" }}>
              {isLogin ? "Зарегистрироваться" : "Войти"}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
