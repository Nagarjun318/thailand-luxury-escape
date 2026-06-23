import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Activity, ActivityStatus } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ----------------------------- Currency / numbers ----------------------------- */

export function formatTHB(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function thbToInr(thb: number, rate: number) {
  return Math.round(thb * rate);
}

export function inrToThb(inr: number, rate: number) {
  return Math.round((inr / rate) * 100) / 100;
}

/* --------------------------------- Date / time -------------------------------- */

/* ------------------------------ Display zone ------------------------------ */

export type DisplayZone = "ICT" | "IST";

const ZONE_IANA: Record<DisplayZone, string> = {
  ICT: "Asia/Bangkok", // Thailand, +07:00
  IST: "Asia/Kolkata", // India, +05:30
};

let displayTimeZone = ZONE_IANA.ICT;

export function setDisplayTimeZone(zone: DisplayZone | undefined) {
  displayTimeZone = ZONE_IANA[zone ?? "ICT"];
}

export function getDisplayZone(): DisplayZone {
  return displayTimeZone === ZONE_IANA.IST ? "IST" : "ICT";
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: displayTimeZone,
  });
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: displayTimeZone,
  });
}

export function formatDateLong(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: displayTimeZone,
  });
}

export function durationLabel(startISO: string, endISO: string) {
  const mins = Math.max(
    0,
    Math.round(
      (new Date(endISO).getTime() - new Date(startISO).getTime()) / 60000
    )
  );
  return minsToLabel(mins);
}

export function minsToLabel(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

export function daysBetween(from: Date, to: Date) {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/* ----------------------------- Activity time logic ---------------------------- */

export function activityStatus(activity: Activity, now: Date): ActivityStatus {
  const start = new Date(activity.startTime).getTime();
  const end = new Date(activity.endTime).getTime();
  const t = now.getTime();
  if (activity.completed || t > end) return "completed";
  if (t >= start && t <= end) return "current";
  return "upcoming";
}

/**
 * Finds the current and next activity from a sorted list, based on `now`.
 */
export function getCurrentAndNext(activities: Activity[], now: Date) {
  const sorted = [...activities].sort(
    (a, b) =>
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
  const t = now.getTime();
  let current: Activity | undefined;
  let next: Activity | undefined;

  for (const a of sorted) {
    const start = new Date(a.startTime).getTime();
    const end = new Date(a.endTime).getTime();
    if (t >= start && t <= end) current = a;
  }
  next = sorted.find((a) => new Date(a.startTime).getTime() > t);

  // If no live current activity, surface the next upcoming as the focus.
  return { current, next, sorted };
}

/* --------------------------------- Misc helpers ------------------------------- */

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now()
    .toString(36)
    .slice(-3)}`;
}

export function clamp(n: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, n));
}

export function pct(value: number, total: number) {
  if (!total) return 0;
  return clamp(Math.round((value / total) * 100));
}

/* ------------------------------- QR matrix (mock) ----------------------------- */

/**
 * Generates a deterministic QR-style boolean matrix from a string.
 * This is a stylised, scannable-looking code for the mock travel app
 * (not a spec-compliant QR encoder). It always renders finder patterns
 * in three corners so it reads as an authentic ticket QR.
 */
export function qrMatrix(data: string, size = 25): boolean[][] {
  const matrix: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false)
  );

  // Simple xorshift-ish hash seeded by the data string.
  let seed = 2166136261;
  for (let i = 0; i < data.length; i++) {
    seed ^= data.charCodeAt(i);
    seed = Math.imul(seed, 16777619);
  }
  const rand = () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return ((seed >>> 0) % 1000) / 1000;
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      matrix[y][x] = rand() > 0.5;
    }
  }

  const placeFinder = (ox: number, oy: number) => {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const border = x === 0 || x === 6 || y === 0 || y === 6;
        const core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        matrix[oy + y][ox + x] = border || core;
      }
    }
    // quiet zone around finder
    for (let i = -1; i <= 7; i++) {
      if (oy + 7 < size && ox + i >= 0 && ox + i < size)
        matrix[oy + 7][Math.min(size - 1, Math.max(0, ox + i))] = false;
      if (ox + 7 < size && oy + i >= 0 && oy + i < size)
        matrix[Math.min(size - 1, Math.max(0, oy + i))][ox + 7] = false;
    }
  };

  placeFinder(0, 0);
  placeFinder(size - 7, 0);
  placeFinder(0, size - 7);

  return matrix;
}
