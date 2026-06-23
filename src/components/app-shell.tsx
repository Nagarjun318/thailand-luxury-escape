"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Plane, Sparkles, MoreHorizontal } from "lucide-react";
import { cn, setDisplayTimeZone } from "@/lib/utils";
import { useTripStore } from "@/lib/store";
import { navItems, bottomNavItems, moreNavItems } from "./nav-items";
import { Drawer } from "./ui/drawer";
import { TimeZoneToggle } from "./timezone-toggle";
import { TimeMachine } from "./time-machine";
import { trip } from "@/lib/seed";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const timeZone = useTripStore((s) => s.settings.timeZone) ?? "ICT";
  const [moreOpen, setMoreOpen] = useState(false);
  const isMoreActive = moreNavItems.some((item) => pathname === item.href);

  // Apply the selected display zone before children render so all date/time
  // formatting reflects it. Keying the content subtree below forces a remount
  // on toggle so every formatted value recomputes.
  setDisplayTimeZone(timeZone);

  return (
    <div className="min-h-screen overflow-x-hidden lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/[0.06] bg-black/30 px-3 py-6 backdrop-blur-xl lg:flex">
        <Link href="/" className="mb-8 flex items-center gap-3 px-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold-300 to-gold-600 shadow-glow-sm">
            <Plane className="size-5 text-black" />
          </div>
          <div className="leading-tight">
            <p className="font-serif text-sm font-semibold gold-text">
              Luxury Escape
            </p>
            <p className="text-[11px] text-muted-foreground">{trip.subtitle}</p>
          </div>
        </Link>

        <nav className="no-scrollbar flex-1 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl bg-gradient-to-br from-gold-300 to-gold-600 shadow-glow-sm"
                    transition={{ type: "spring", damping: 26, stiffness: 320 }}
                  />
                )}
                <Icon className="relative z-10 size-[18px]" />
                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="glass-gold mt-4 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-gold-200">
            <Sparkles className="size-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">
              {trip.travelers.map((t) => t.name).join(" & ")}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            26 – 30 June 2026 · Thailand
          </p>
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-[11px] text-muted-foreground">Time zone</span>
            <TimeZoneToggle />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile time-zone switch */}
        <TimeZoneToggle
          showIcon
          className="fixed right-3 top-3 z-50 shadow-lg lg:hidden"
        />
        <main className="flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12">
          <div key={timeZone} className="mx-auto w-full max-w-5xl">
            {children}
          </div>
        </main>
      </div>

      {/* Time simulator for testing upcoming activities */}
      <TimeMachine />

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/70 backdrop-blur-2xl lg:hidden">
        <div className="mx-auto flex max-w-lg items-stretch justify-between px-2 py-1.5">
          {bottomNavItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-medium transition-colors",
                  active ? "text-gold-300" : "text-muted-foreground"
                )}
              >
                <Icon className="size-5" />
                {item.short}
                {active && (
                  <motion.span
                    layoutId="bottom-active"
                    className="absolute -top-1 h-1 w-8 rounded-full bg-gold-400"
                  />
                )}
              </Link>
            );
          })}
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              "relative flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-medium transition-colors",
              isMoreActive ? "text-gold-300" : "text-muted-foreground"
            )}
          >
            <MoreHorizontal className="size-5" />
            More
            {isMoreActive && (
              <motion.span
                layoutId="bottom-active"
                className="absolute -top-1 h-1 w-8 rounded-full bg-gold-400"
              />
            )}
          </button>
        </div>
      </nav>

      {/* More drawer */}
      <Drawer open={moreOpen} onClose={() => setMoreOpen(false)} title="More">
        <nav className="flex flex-col gap-1 p-4">
          {moreNavItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMoreOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                  active
                    ? "bg-gold-500/15 text-gold-300"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )}
              >
                <Icon className="size-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </Drawer>
    </div>
  );
}
