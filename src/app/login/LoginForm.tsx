"use client";

import { useState, useTransition } from "react";
import { signIn, signUp } from "@/actions/auth";

export default function LoginForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const action = mode === "signin" ? signIn : signUp;
      const result = await action(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="mb-6 text-sm font-medium text-white/60">
          {mode === "signin"
            ? "Sign in to your workspace"
            : "Create your workspace"}
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-xs font-medium tracking-wide text-white/40 uppercase"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@company.com"
            className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none transition focus:ring-1 focus:ring-[#2d7bff]"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-xs font-medium tracking-wide text-white/40 uppercase"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            placeholder="••••••••"
            className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none transition focus:ring-1 focus:ring-[#2d7bff]"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          />
        </div>
      </div>

      {error && (
        <div
          className="rounded-xl px-4 py-3 text-sm text-red-300"
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
        >
          <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-red-400 align-middle" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="glass-hover mt-2 w-full rounded-xl py-3 text-sm font-semibold text-white transition disabled:opacity-50"
        style={{
          background: isPending
            ? "rgba(45,123,255,0.3)"
            : "rgba(45,123,255,0.2)",
          border: "1px solid rgba(45,123,255,0.4)",
          boxShadow: isPending ? "none" : "0 0 20px rgba(45,123,255,0.15)",
        }}
      >
        {isPending
          ? "Connecting…"
          : mode === "signin"
            ? "Sign In"
            : "Create Account"}
      </button>

      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
          }}
          className="text-xs text-white/35 transition hover:text-white/60"
        >
          {mode === "signin"
            ? "No account? Create one →"
            : "Already have an account? Sign in →"}
        </button>
      </div>
    </form>
  );
}
