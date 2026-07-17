"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordResetAction } from "@/actions/auth";
import { AuthCard } from "@/components/auth-card";

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, undefined);

  return (
    <AuthCard title="Forgot your password?" subtitle="We'll email you a link to reset it">
      {state?.success ? (
        <p className="text-sm text-parchment-ink/80">
          If an account exists for that email, a reset link is on its way — check your inbox
          (and spam folder) for a message from Armistead Academy. The link expires in an hour.
        </p>
      ) : (
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
          </div>

          {state?.error && <p className="text-claret-600 text-sm">{state.error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-claret-600 text-parchment-100 rounded-md py-2.5 font-medium hover:bg-claret-500 transition-colors disabled:opacity-60"
          >
            {pending ? "Sending..." : "Send reset link"}
          </button>
        </form>
      )}

      <p className="text-sm text-center mt-5 text-parchment-ink/70">
        <Link href="/login" className="text-claret-600 font-medium hover:underline">
          Back to log in
        </Link>
      </p>
    </AuthCard>
  );
}
