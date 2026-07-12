"use client";

import { useActionState } from "react";
import { use } from "react";
import Link from "next/link";
import { resetPasswordAction } from "@/actions/auth";
import { AuthCard } from "@/components/auth-card";

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [state, formAction, pending] = useActionState(resetPasswordAction, undefined);

  return (
    <AuthCard title="Choose a new password" subtitle="This link is single-use and expires in an hour">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="token" value={token} />
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="password">
            New password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoFocus
            className="w-full rounded-md border border-parchment-ink/20 bg-white/60 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brass-500"
          />
        </div>

        {state?.error && <p className="text-claret-600 text-sm">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-claret-600 text-parchment-100 rounded-md py-2.5 font-medium hover:bg-claret-500 transition-colors disabled:opacity-60"
        >
          {pending ? "Saving..." : "Reset password"}
        </button>
      </form>

      <p className="text-sm text-center mt-5 text-parchment-ink/70">
        <Link href="/forgot-password" className="text-claret-600 font-medium hover:underline">
          Request a new link
        </Link>
      </p>
    </AuthCard>
  );
}
