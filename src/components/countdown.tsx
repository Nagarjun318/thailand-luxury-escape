"use client";

import * as React from "react";

/* ----------------------------- Simulated clock ---------------------------- */
/**
 * A global, app-wide clock offset used for manually simulating the current
 * time while testing (e.g. to verify upcoming-activity behaviour). When the
 * offset is 0 the app uses the real wall-clock time.
 */
let simOffsetMs = 0;
const simListeners = new Set<() => void>();

function emitSim() {
  simListeners.forEach((l) => l());
}

/** Current (possibly simulated) time in milliseconds. */
export function getSimNow(): number {
  return Date.now() + simOffsetMs;
}

/** Offset applied to the real clock, in ms (0 = live). */
export function getSimOffset(): number {
  return simOffsetMs;
}

/** Whether a manual time simulation is currently active. */
export function isSimActive(): boolean {
  return simOffsetMs !== 0;
}

/** Set the simulated "now". Pass null to return to the real clock. */
export function setSimNow(target: Date | null) {
  simOffsetMs = target ? target.getTime() - Date.now() : 0;
  emitSim();
}

/** Nudge the simulated clock by a number of milliseconds. */
export function shiftSimNow(deltaMs: number) {
  simOffsetMs += deltaMs;
  emitSim();
}

/** Subscribe to simulation changes. Returns an unsubscribe function. */
export function subscribeSim(cb: () => void): () => void {
  simListeners.add(cb);
  return () => simListeners.delete(cb);
}

interface Parts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
}

function diff(target: Date): Parts {
  const ms = target.getTime() - getSimNow();
  if (ms <= 0)
    return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  return {
    days: Math.floor(ms / 86400000),
    hours: Math.floor((ms / 3600000) % 24),
    minutes: Math.floor((ms / 60000) % 60),
    seconds: Math.floor((ms / 1000) % 60),
    done: false,
  };
}

/**
 * Live countdown hook. Returns null until mounted to avoid hydration mismatch.
 */
export function useCountdown(targetISO: string): Parts | null {
  const [parts, setParts] = React.useState<Parts | null>(null);

  React.useEffect(() => {
    const target = new Date(targetISO);
    const tick = () => setParts(diff(target));
    tick();
    const id = setInterval(tick, 1000);
    const off = subscribeSim(tick);
    return () => {
      clearInterval(id);
      off();
    };
  }, [targetISO]);

  return parts;
}

/** Live ticking clock; returns a Date that updates every second after mount. */
export function useNow(intervalMs = 1000): Date | null {
  const [now, setNow] = React.useState<Date | null>(null);
  React.useEffect(() => {
    const update = () => setNow(new Date(getSimNow()));
    update();
    const id = setInterval(update, intervalMs);
    const off = subscribeSim(update);
    return () => {
      clearInterval(id);
      off();
    };
  }, [intervalMs]);
  return now;
}
