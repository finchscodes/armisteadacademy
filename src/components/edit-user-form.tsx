"use client";

import { useActionState } from "react";
import { updateUserAction } from "@/actions/admin";

export function EditUserForm({
  userId,
  username,
  email,
  isAdmin,
}: {
  userId: number;
  username: string;
  email: string;
  isAdmin: boolean;
}) {
  const [state, formAction, pending] = useActionState(updateUserAction, undefined);

  return (
    <form action={formAction} className="space-y-4 bg-ink-900 border border-ink-700 rounded-lg p-6">
      <input type="hidden" name="userId" value={userId} />

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="username">
          Username
        </label>
        <input
          id="username"
          name="username"
          defaultValue={username}
          required
          className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 focus:outline-none focus:border-brass-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={email}
          required
          className="w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 focus:outline-none focus:border-brass-500"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isAdmin"
          defaultChecked={isAdmin}
          className="rounded border-ink-600 bg-ink-800"
        />
        <span>
          Admin access
          <span className="text-ink-400"> — every character on this account gets hidden admin
          access. Grant carefully.</span>
        </span>
      </label>

      {state?.error && <p className="text-claret-500 text-sm">{state.error}</p>}
      {state?.success && <p className="text-brass-400 text-sm">{state.success}</p>}

      <button
        type="submit"
        disabled={pending}
        className="bg-brass-500 text-ink-950 rounded-md px-5 py-2.5 font-medium hover:bg-brass-400 transition-colors disabled:opacity-60"
      >
        {pending ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
