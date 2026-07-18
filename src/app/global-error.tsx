"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-ink-950 text-parchment-100 min-h-screen flex items-center justify-center">
        <div className="max-w-sm mx-auto text-center px-6">
          <h1 className="font-display text-2xl text-gunmetal-400 mb-2">Something went wrong</h1>
          <p className="text-sm text-ink-400 mb-6">
            An unexpected error occurred loading this page. Try refreshing — if it keeps
            happening, let an admin know what you were doing when it happened.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="bg-gunmetal-500 text-ink-950 rounded-md px-5 py-2.5 font-medium hover:bg-gunmetal-400 transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
