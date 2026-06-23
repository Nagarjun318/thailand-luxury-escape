"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, X, RotateCcw, ChevronRight } from "lucide-react";
import { useTripStore } from "@/lib/store";
import {
  useNow,
  setSimNow,
  shiftSimNow,
  isSimActive,
  subscribeSim,
  getSimNow,
} from "@/components/countdown";
import { formatDateLong, formatTime, cn } from "@/lib/utils";

const HOUR = 3600000;
const MIN = 60000;
const DAY = 86400000;

/** Reactive flag for whether a simulation is active. */
function useSimActive() {
  return React.useSyncExternalStore(
    subscribeSim,
    () => isSimActive(),
    () => false,
  );
}

export function TimeMachine() {
  const [open, setOpen] = React.useState(false);
  const now = useNow(1000);
  const active = useSimActive();
  const activities = useTripStore((s) => s.activities);

  const sorted = React.useMemo(
    () =>
      [...activities].sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      ),
    [activities],
  );

  return (
    <div className="fixed bottom-20 left-3 z-50 md:bottom-4">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: "spring", damping: 24, stiffness: 320 }}
            className="glass mb-2 w-72 overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gold-300">
                <Clock className="size-3.5" /> Time Machine
              </span>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Current simulated time */}
            <div className="px-4 py-3">
              <p className="font-serif text-lg font-semibold">
                {now ? formatTime(now.toISOString()) : "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                {now ? formatDateLong(now.toISOString()) : ""}
              </p>
              <span
                className={cn(
                  "mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium",
                  active
                    ? "bg-gold-400/20 text-gold-200"
                    : "bg-emerald-400/15 text-emerald-300",
                )}
              >
                {active ? "Simulated" : "Live"}
              </span>
            </div>

            {/* Nudge controls */}
            <div className="grid grid-cols-3 gap-1.5 px-4 pb-2">
              {[
                { label: "-1d", ms: -DAY },
                { label: "-1h", ms: -HOUR },
                { label: "-15m", ms: -15 * MIN },
                { label: "+15m", ms: 15 * MIN },
                { label: "+1h", ms: HOUR },
                { label: "+1d", ms: DAY },
              ].map((b) => (
                <button
                  key={b.label}
                  onClick={() => shiftSimNow(b.ms)}
                  className="rounded-lg border border-white/10 bg-white/[0.03] py-1.5 text-xs font-medium transition-colors hover:border-gold/40 hover:text-gold-200"
                >
                  {b.label}
                </button>
              ))}
            </div>

            {/* Exact time input + reset */}
            <div className="flex items-center gap-2 px-4 pb-3">
              <input
                type="datetime-local"
                value={now ? toLocalInput(now) : ""}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v) setSimNow(new Date(v));
                }}
                className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 text-xs [color-scheme:dark]"
              />
              <button
                onClick={() => setSimNow(null)}
                disabled={!active}
                title="Reset to real time"
                className="flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1.5 text-xs transition-colors hover:border-gold/40 disabled:opacity-40"
              >
                <RotateCcw className="size-3.5" />
              </button>
            </div>

            {/* Jump to activity */}
            <div className="border-t border-white/10">
              <p className="px-4 pb-1 pt-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                Jump to activity
              </p>
              <div className="no-scrollbar max-h-56 overflow-y-auto pb-2">
                {sorted.map((a) => (
                  <button
                    key={a.id}
                    onClick={() =>
                      setSimNow(new Date(new Date(a.startTime).getTime() - MIN))
                    }
                    className="flex w-full items-center gap-2 px-4 py-1.5 text-left text-xs transition-colors hover:bg-white/5"
                  >
                    <span className="w-7 shrink-0 text-[10px] text-muted-foreground">
                      D{a.day}
                    </span>
                    <span className="w-12 shrink-0 tabular-nums text-gold-300">
                      {formatTime(a.startTime)}
                    </span>
                    <span className="truncate flex-1">
                      {a.emoji ?? "📍"} {a.title}
                    </span>
                    <ChevronRight className="size-3 shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur transition-colors",
          active
            ? "bg-gold-400/20 text-gold-200 ring-1 ring-gold-400/40"
            : "glass text-muted-foreground hover:text-foreground",
        )}
        title="Simulate time"
      >
        <Clock className="size-3.5" />
        {active && now ? formatTime(now.toISOString()) : "Time"}
      </button>
    </div>
  );
}

/** Format a Date as the value a datetime-local input expects (local wall time). */
function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}
