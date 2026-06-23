"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Tab {
  value: string;
  label: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  value: string;
  onValueChange: (v: string) => void;
  className?: string;
  layoutId?: string;
}

export function Tabs({
  tabs,
  value,
  onValueChange,
  className,
  layoutId = "tab-indicator",
}: TabsProps) {
  return (
    <div
      className={cn(
        "no-scrollbar flex gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] p-1.5",
        className
      )}
    >
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            onClick={() => onValueChange(tab.value)}
            className={cn(
              "relative whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-colors",
              active
                ? "text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {active && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-0 rounded-xl bg-gradient-to-br from-gold-300 to-gold-600 shadow-glow-sm"
                transition={{ type: "spring", damping: 26, stiffness: 320 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
