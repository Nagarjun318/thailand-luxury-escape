"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  MapPin,
  CalendarDays,
  Plane,
  Sparkles,
} from "lucide-react";
import { trip } from "@/lib/seed";
import { useCountdown } from "@/components/countdown";
import { Button } from "@/components/ui/button";

const TRIP_START = "2026-06-26T00:00:00+07:00";

export default function LandingPage() {
  const cd = useCountdown(TRIP_START);

  const stats = [
    { label: "Days", value: cd?.days },
    { label: "Hours", value: cd?.hours },
    { label: "Mins", value: cd?.minutes },
    { label: "Secs", value: cd?.seconds },
  ];

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden">
      {/* Ambient backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 top-10 size-72 rounded-full bg-gold-500/20 blur-[120px]" />
        <div className="absolute -right-20 top-40 size-80 rounded-full bg-amber-700/20 blur-[130px]" />
        <div className="absolute bottom-0 left-1/2 size-96 -translate-x-1/2 rounded-full bg-gold-700/10 blur-[140px]" />
      </div>

      {/* Top bar */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold-300 to-gold-600 shadow-glow-sm">
            <Plane className="size-5 text-black" />
          </div>
          <span className="font-serif text-lg font-semibold gold-text">
            Luxury Escape
          </span>
        </div>
        <Link
          href="/dashboard"
          className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
        >
          Open Dashboard →
        </Link>
      </header>

      {/* Hero */}
      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass-gold mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-gold-200"
        >
          <Sparkles className="size-3.5" />
          {trip.travelers.map((t) => t.name).join(" & ")} · 2026
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05 }}
          className="font-serif text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl"
        >
          <span className="gold-text">Thailand</span>
          <br />
          Luxury Escape{" "}
          <span className="text-foreground/90">2026</span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground"
        >
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-4 text-gold-400" /> Pattaya + Bangkok
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-4 text-gold-400" /> 26 – 30 June 2026
          </span>
        </motion.div>

        {/* Countdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mt-10 w-full"
        >
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-gold-300/80">
            Travel Countdown
          </p>
          <div className="mx-auto grid max-w-md grid-cols-4 gap-3">
            {stats.map((s) => (
              <div
                key={s.label}
                className="glass rounded-2xl px-2 py-4"
              >
                <div className="font-serif text-3xl font-bold tabular-nums gold-text sm:text-4xl">
                  {s.value === undefined
                    ? "--"
                    : String(s.value).padStart(2, "0")}
                </div>
                <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 font-serif text-lg text-foreground/90">
            {cd
              ? cd.done
                ? "The escape has begun ✨"
                : `${cd.days} Days Remaining`
              : "\u00A0"}
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="mt-10"
        >
          <Link href="/dashboard">
            <Button size="lg" className="group">
              Open Trip Dashboard
              <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
        </motion.div>
      </section>

      <footer className="mx-auto w-full max-w-6xl px-6 py-6 text-center text-xs text-muted-foreground">
        Crafted for {trip.travelers.map((t) => t.name).join(" & ")} · A premium
        travel companion
      </footer>
    </main>
  );
}
