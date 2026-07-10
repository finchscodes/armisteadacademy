let audioCtx: AudioContext | null = null;

function getContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  return audioCtx;
}

/**
 * Browsers block audio from starting until there's been a real user gesture
 * (click/keypress) somewhere on the page — a setInterval-driven poll doesn't
 * count as one. Call this from a click/keydown handler early on (e.g. once,
 * the first time the user interacts with the page) so the context is already
 * running by the time a ping needs to play asynchronously later.
 */
export function primeAudio() {
  try {
    const ctx = getContext();
    if (ctx.state === "suspended") ctx.resume();
  } catch {
    // Fine if this fails — playPingSound() will just no-op later too.
  }
}

/** Plays a short two-tone chime. Call primeAudio() from a user gesture first, or this may be silently blocked. */
export function playPingSound() {
  try {
    const ctx = getContext();
    if (ctx.state === "suspended") ctx.resume();

    const now = ctx.currentTime;
    const notes = [880, 1175]; // a quick two-note chime
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = now + i * 0.11;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.15, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.26);
    });
  } catch {
    // Audio isn't critical — fail silently (e.g. browser blocked autoplay).
  }
}
