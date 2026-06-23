"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  CalendarRange,
  MapPin,
  Clock,
  Check,
  StickyNote,
  Coins,
} from "lucide-react";
import { useTripStore } from "@/lib/store";
import { useNow } from "@/components/countdown";
import {
  PageHeader,
  FadeIn,
  useMounted,
  StatCard,
} from "@/components/common";
import { Tabs } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { transportInfo } from "@/components/transport";
import {
  activityStatus,
  durationLabel,
  formatTime,
  formatTHB,
  cn,
  pct,
} from "@/lib/utils";
import type { Activity, ActivityStatus } from "@/lib/types";

const DAY_LABELS: Record<number, { date: string; place: string }> = {
  1: { date: "26 Jun", place: "Pattaya" },
  2: { date: "27 Jun", place: "Pattaya" },
  3: { date: "28 Jun", place: "Bangkok" },
  4: { date: "29 Jun", place: "Bangkok" },
  5: { date: "30 Jun", place: "Bangkok" },
};

const statusStyle: Record<
  ActivityStatus,
  { dot: string; ring: string; badge: "success" | "default" | "muted"; label: string }
> = {
  completed: {
    dot: "bg-emerald-400",
    ring: "ring-emerald-400/30",
    badge: "success",
    label: "Done",
  },
  current: {
    dot: "bg-gold-400 animate-pulse",
    ring: "ring-gold-400/40",
    badge: "default",
    label: "Now",
  },
  upcoming: {
    dot: "bg-white/30",
    ring: "ring-white/10",
    badge: "muted",
    label: "Upcoming",
  },
};

export default function ItineraryPage() {
  const mounted = useMounted();
  const now = useNow(30000);
  const { activities, toggleActivity } = useTripStore();
  const [day, setDay] = React.useState("1");

  if (!mounted || !now) return null;

  const dayActivities = activities
    .filter((a) => a.day === Number(day))
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

  const completedCount = activities.filter((a) => a.completed).length;
  const dayCost = dayActivities.reduce((s, a) => s + a.cost, 0);

  return (
    <>
      <PageHeader
        title="Full Itinerary"
        subtitle="5 days · 19 curated experiences"
        icon={CalendarRange}
      />

      <FadeIn className="mb-5 grid grid-cols-3 gap-3">
        <StatCard label="Total Activities" value={activities.length} />
        <StatCard label="Completed" value={completedCount} accent />
        <StatCard
          label="Completion"
          value={`${pct(completedCount, activities.length)}%`}
        />
      </FadeIn>

      <FadeIn delay={0.05} className="mb-6">
        <Tabs
          value={day}
          onValueChange={setDay}
          layoutId="itinerary-day"
          tabs={[1, 2, 3, 4, 5].map((d) => ({
            value: String(d),
            label: (
              <span className="flex flex-col items-center leading-tight">
                <span className="text-sm font-semibold">Day {d}</span>
                <span className="text-[10px] opacity-80">
                  {DAY_LABELS[d].date}
                </span>
              </span>
            ),
          }))}
        />
      </FadeIn>

      <FadeIn delay={0.1} className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl font-semibold">
            Day {day} · {DAY_LABELS[Number(day)].place}
          </h2>
          <p className="text-sm text-muted-foreground">
            {DAY_LABELS[Number(day)].date} 2026 · {dayActivities.length}{" "}
            activities
          </p>
        </div>
        <Badge variant="secondary">
          <Coins className="size-3" /> {formatTHB(dayCost)}
        </Badge>
      </FadeIn>

      {/* Timeline */}
      <div className="relative pl-2">
        <div className="absolute bottom-2 left-[15px] top-2 w-px bg-gradient-to-b from-gold-500/40 via-white/10 to-transparent" />
        <div className="space-y-3">
          {dayActivities.map((act, i) => {
            const status = activityStatus(act, now);
            return (
              <TimelineRow
                key={act.id}
                activity={act}
                status={status}
                index={i}
                onToggle={() => toggleActivity(act.id)}
              />
            );
          })}
        </div>
      </div>
    </>
  );
}

function TimelineRow({
  activity,
  status,
  index,
  onToggle,
}: {
  activity: Activity;
  status: ActivityStatus;
  index: number;
  onToggle: () => void;
}) {
  const s = statusStyle[status];
  const Icon = transportInfo(activity.transport).icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="relative pl-8"
    >
      <span
        className={cn(
          "absolute left-[7px] top-5 size-4 rounded-full ring-4 ring-offset-0",
          s.dot,
          s.ring
        )}
      />
      <Card
        className={cn(
          "p-4 transition-colors",
          status === "current" && "glass-gold"
        )}
      >
        <div className="flex items-start gap-3">
          <div className="text-2xl">{activity.emoji ?? "📍"}</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3
                className={cn(
                  "font-serif text-base font-semibold",
                  status === "completed" && "text-muted-foreground line-through"
                )}
              >
                {activity.title}
              </h3>
              <Badge variant={s.badge}>{s.label}</Badge>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3 text-gold-400" />
                {formatTime(activity.startTime)} –{" "}
                {formatTime(activity.endTime)}
              </span>
              <span>· {durationLabel(activity.startTime, activity.endTime)}</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3 text-gold-400" />
                {activity.location}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Icon className="size-3.5 text-gold-400" />
                {transportInfo(activity.transport).label}
              </span>
              {activity.cost > 0 && (
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Coins className="size-3.5 text-gold-400" />
                  {formatTHB(activity.cost)}
                </span>
              )}
            </div>
            {activity.notes && (
              <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-white/[0.03] p-2 text-xs text-muted-foreground">
                <StickyNote className="mt-px size-3.5 shrink-0 text-gold-400" />
                {activity.notes}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={onToggle}
          className={cn(
            "mt-3 flex w-full items-center justify-center gap-2 rounded-xl border py-2 text-xs font-medium transition-colors",
            activity.completed
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-white/10 text-muted-foreground hover:border-gold/40 hover:text-foreground"
          )}
        >
          <span
            className={cn(
              "flex size-4 items-center justify-center rounded-full border",
              activity.completed
                ? "border-emerald-400 bg-emerald-400 text-black"
                : "border-white/30"
            )}
          >
            {activity.completed && <Check className="size-3" />}
          </span>
          {activity.completed ? "Completed" : "Mark as completed"}
        </button>
      </Card>
    </motion.div>
  );
}
