"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction } from "@/actions/auth";
import { AuthCard } from "@/components/auth-card";

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, undefined);

  return (
    <AuthCard title="Join Armistead" subtitle="Create your account, then your first character">
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
            className="w-full rounded-md border border-parchment-ink/20 bg-white/60 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gunmetal-500"
          />
          <p className="text-xs text-parchment-ink/60 mt-1">
            This is your account login — your character will have its own display name.
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            className="w-full rounded-md border border-parchment-ink/20 bg-white/60 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gunmetal-500"
          />
        </div>

        {state?.error && <p className="text-claret-600 text-sm">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-claret-600 text-parchment-100 rounded-md py-2.5 font-medium hover:bg-claret-500 transition-colors disabled:opacity-60"
        >
          {pending ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="text-sm text-center mt-5 text-parchment-ink/70">
        Already have an account?{" "}
        <Link href="/login" className="text-claret-600 font-medium hover:underline">
          Log in
        </Link>
      </p>
    </AuthCard>
  );
}
