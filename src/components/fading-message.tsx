"use client";

import { useEffect, useState } from "react";

const VISIBLE_MS = 2500;
const FADE_MS = 400;

/**
 * A success/error line that fades itself out a couple seconds after
 * appearing — for small transient confirmations (XP gained, hunger
 * restored) that shouldn't linger in the UI like a persistent error would.
 * Resets its own timer whenever the message text changes.
 */
export function FadingMessage({
  message,
  variant = "success",
}: {
  message: string | null;
  variant?: "success" | "error";
}) {
  if (!message) return null;
  // Keyed on the message text so a new message forces a fresh mount of
  // FadeTimer below, rather than needing an effect to reset state on an
  // existing instance (which would mean calling setState synchronously
  // from inside the effect body).
  return <FadeTimer key={message} message={message} variant={variant} />;
}

function FadeTimer({ message, variant }: { message: string; variant: "success" | "error" }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setVisible(false), VISIBLE_MS);
    return () => clearTimeout(fadeTimer);
  }, []);

  return (
    <p
      className="text-sm transition-opacity"
      style={{
        color: variant === "success" ? "#68846c" : "#c43030",
        opacity: visible ? 1 : 0,
        transitionDuration: `${FADE_MS}ms`,
      }}
    >
      {message}
    </p>
  );
}
