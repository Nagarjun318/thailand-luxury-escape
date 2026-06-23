"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { useTripStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { key: "ICT", short: "TH", label: "Thailand", offset: "+07:00" },
  { key: "IST", short: "IN", label: "India", offset: "+05:30" },
] as const;

export function TimeZoneToggle({
  className,
  showIcon = false,
}: {
  className?: string;
  showIcon?: boolean;
}) {
  const timeZone = useTripStore((s) => s.settings.timeZone) ?? "ICT";
  const updateSettings = useTripStore((s) => s.updateSettings);

  return (
    <div
      role="group"
      aria-label="Display time zone"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-white/10 bg-white/5 p-0.5 text-xs backdrop-blur",
        className,
      )}
    >
      {showIcon && (
        <Clock className="ml-1.5 size-3.5 shrink-0 text-gold-300" />
      )}
      {OPTIONS.map((o) => {
        const active = timeZone === o.key;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => updateSettings({ timeZone: o.key })}
            aria-pressed={active}
            title={`${o.label} time (${o.offset})`}
            className={cn(
              "rounded-full px-2.5 py-1 font-semibold transition-colors",
              active
                ? "bg-gradient-to-br from-gold-300 to-gold-600 text-black"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.short}
          </button>
        );
      })}
    </div>
  );
}
