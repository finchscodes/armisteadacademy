"use client";

import { useEffect } from "react";
import { heartbeatAction } from "@/actions/heartbeat";

const HEARTBEAT_INTERVAL_MS = 60 * 1000; // 1 minute — well inside the 3-minute online window

export function HeartbeatPing() {
  useEffect(() => {
    heartbeatAction();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") heartbeatAction();
    }, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return null;
}
