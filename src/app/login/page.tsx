"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "@/actions/auth";
import { AuthCard } from "@/components/auth-card";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <AuthCard title="Welcome back" subtitle="Log in to continue your story">
      <form action={formAction} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-md border border-parchment-ink/20 bg-white/60 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brass-500"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium" htmlFor="password">
              Password
            </label>
            <Link href="/forgot-password" className="text-xs text-claret-600 hover:underline">
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full rounded-md border border-parchment-ink/20 bg-white/60 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brass-500"
          />
        </div>

        {state?.error && <p className="text-claret-600 text-sm">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-claret-600 text-parchment-100 rounded-md py-2.5 font-medium hover:bg-claret-500 transition-colors disabled:opacity-60"
        >
          {pending ? "Logging in..." : "Log in"}
        </button>
      </form>

      <p className="text-sm text-center mt-5 text-parchment-ink/70">
        New here?{" "}
        <Link href="/register" className="text-claret-600 font-medium hover:underline">
          Create an account
        </Link>
      </p>
    </AuthCard>
  );
}
