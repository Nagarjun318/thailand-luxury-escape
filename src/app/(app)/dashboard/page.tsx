"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Clock,
  MapPin,
  ArrowRight,
  CheckCircle2,
  CircleDot,
  CalendarClock,
  Wallet,
  ShoppingBag,
  Plane,
  Hourglass,
  TrendingUp,
} from "lucide-react";
import { useTripStore } from "@/lib/store";
import { trip } from "@/lib/seed";
import { useNow } from "@/components/countdown";
import {
  FadeIn,
  PageHeader,
  StatCard,
  SectionHeading,
  useMounted,
} from "@/components/common";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/drawer";
import { QRCode } from "@/components/qr-code";
import { PdfViewer } from "@/components/pdf-viewer";
import { TransportBadge, transportInfo } from "@/components/transport";
import {
  getCurrentAndNext,
  activityStatus,
  durationLabel,
  formatTime,
  formatDate,
  minsToLabel,
  formatTHB,
  formatINR,
  thbToInr,
  pct,
  daysBetween,
  cn,
} from "@/lib/utils";

const TRIP_START = "2026-06-26T00:00:00+07:00";

type ActivityTicket = {
  title?: string;
  codes?: { imageUrl: string; text?: string; format?: string }[];
  qrImageUrl?: string;
  qrText?: string;
  qrData?: string;
  pdfUrl?: string;
};

type QrItem = {
  imageUrl?: string;
  data?: string;
  text?: string;
  format?: string;
};

function getQrItems(ticket: ActivityTicket | null): QrItem[] {
  if (!ticket) return [];
  if (ticket.codes && ticket.codes.length > 0) {
    return ticket.codes.map((c) => ({
      imageUrl: c.imageUrl,
      text: c.text,
      format: c.format,
    }));
  }
  if (ticket.qrImageUrl) return [{ imageUrl: ticket.qrImageUrl, text: ticket.qrText }];
  if (ticket.qrData) return [{ data: ticket.qrData, text: ticket.qrText }];
  return [];
}

/** Find the ticket whose time is closest to an activity (within 90 minutes). */
function findTicketForActivity<
  T extends { date: string },
  A extends { startTime: string },
>(activity: A | null | undefined, tickets: T[]): T | null {
  if (!activity) return null;
  const at = new Date(activity.startTime).getTime();
  let best: T | null = null;
  let bestDelta = Infinity;
  for (const t of tickets) {
    const delta = Math.abs(new Date(t.date).getTime() - at);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = t;
    }
  }
  return bestDelta <= 90 * 60 * 1000 ? best : null;
}

export default function DashboardPage() {
  const mounted = useMounted();
  const now = useNow(1000);
  const { activities, expenses, shopping, settings, tickets } = useTripStore();

  if (!mounted || !now) return <DashboardSkeleton />;

  const { current, next } = getCurrentAndNext(activities, now);
  const focus = current ?? next; // what to feature
  const focusTicket = findTicketForActivity(focus, tickets);
  const nextTicket = findTicketForActivity(next, tickets);

  const completed = activities.filter(
    (a) => activityStatus(a, now) === "completed"
  ).length;
  const total = activities.length;
  const remaining = total - completed;
  const completionPct = pct(completed, total);

  const tripDay = Math.min(
    5,
    Math.max(1, daysBetween(new Date(TRIP_START), now) + 1)
  );
  const beforeTrip = now < new Date(TRIP_START);

  const todaySpend = expenses
    .filter((e) => {
      const d = new Date(e.date);
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    })
    .reduce((s, e) => s + e.amountTHB, 0);
  const totalSpend = expenses.reduce((s, e) => s + e.amountTHB, 0);
  const remainingBudget = Math.max(0, trip.budgetTHB - totalSpend);

  const shoppingDone = shopping.filter((s) => s.purchased).length;

  let timeRemainingLabel = "";
  if (current) {
    const mins = Math.round(
      (new Date(current.endTime).getTime() - now.getTime()) / 60000
    );
    timeRemainingLabel = `${minsToLabel(Math.max(0, mins))} left`;
  } else if (next) {
    const mins = Math.round(
      (new Date(next.startTime).getTime() - now.getTime()) / 60000
    );
    const days = Math.floor(mins / 1440);
    timeRemainingLabel =
      days > 0 ? `in ${days}d ${minsToLabel(mins % 1440)}` : `in ${minsToLabel(mins)}`;
  }

  return (
    <>
      <PageHeader
        title={`Welcome, ${trip.travelers[0].name.split(" ")[0]}`}
        subtitle={
          beforeTrip
            ? "Your Thailand escape is almost here"
            : `Day ${tripDay} of 5 · ${trip.destinations.join(" & ")}`
        }
        icon={CalendarClock}
      />

      {/* Current status */}
      <FadeIn className="mb-6">
        <Card gold className="overflow-hidden p-0">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-gold-400 opacity-60" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-gold-400" />
                </span>
                <span className="text-xs font-medium uppercase tracking-widest text-gold-300">
                  {current ? "Happening now" : beforeTrip ? "Trip starts soon" : "Up next"}
                </span>
              </div>
              <h2 className="font-serif text-2xl font-semibold">
                {focus ? (
                  <>
                    {focus.emoji} {focus.title}
                  </>
                ) : (
                  "All activities complete 🎉"
                )}
              </h2>
              {focus && (
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-gold-400" />
                    {focus.location}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="size-3.5 text-gold-400" />
                    {formatTime(focus.startTime)} – {formatTime(focus.endTime)}
                  </span>
                </div>
              )}
            </div>
            {focus && (
              <div className="shrink-0 flex flex-col items-end gap-2">
                <div className="rounded-2xl glass px-5 py-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-gold-300">
                    <Hourglass className="size-4" />
                    <span className="text-xs font-medium uppercase tracking-wide">
                      {current ? "Time left" : "Starts"}
                    </span>
                  </div>
                  <p className="mt-1 font-serif text-lg font-semibold">
                    {timeRemainingLabel}
                  </p>
                </div>
                <TicketAccess ticket={focusTicket} title={focus.title} compact />
              </div>
            )}
          </div>

          {/* Now → Next strip */}
          {next && current && (
            <div className="flex items-center gap-3 border-t border-white/10 bg-black/20 px-5 py-3">
              <Badge variant="muted">Next</Badge>
              <span className="truncate text-sm">
                {next.emoji} {next.title}
              </span>
              <span className="ml-auto text-sm text-muted-foreground">
                {formatTime(next.startTime)}
              </span>
            </div>
          )}
        </Card>
      </FadeIn>

      {/* Progress */}
      <FadeIn delay={0.05} className="mb-6">
        <Card className="p-5">
          <SectionHeading
            title="Trip Progress"
            action={
              <Badge variant="success">
                <TrendingUp className="size-3" /> {completionPct}% done
              </Badge>
            }
          />
          <Progress value={completionPct} className="h-3" />
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="font-serif text-2xl font-semibold text-emerald-300">
                {completed}
              </p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <div>
              <p className="font-serif text-2xl font-semibold gold-text">
                {remaining}
              </p>
              <p className="text-xs text-muted-foreground">Remaining</p>
            </div>
            <div>
              <p className="font-serif text-2xl font-semibold">{total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
        </Card>
      </FadeIn>

      {/* Upcoming activity widget */}
      {next && (
        <FadeIn delay={0.1} className="mb-6">
          <SectionHeading
            title="Upcoming Activity"
            action={
              <Link
                href="/itinerary"
                className="text-xs text-gold-300 hover:underline"
              >
                Full itinerary
              </Link>
            }
          />
          <UpcomingCard activity={next} ticket={nextTicket} />
        </FadeIn>
      )}

      {/* Quick stats */}
      <FadeIn delay={0.15}>
        <SectionHeading title="At a Glance" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            label="Today's Spend"
            value={formatTHB(todaySpend)}
            sub={`${formatINR(thbToInr(todaySpend, settings.thbToInr))}`}
            icon={Wallet}
          />
          <StatCard
            label="Remaining Budget"
            value={formatTHB(remainingBudget)}
            sub={`of ${formatTHB(trip.budgetTHB)}`}
            icon={Wallet}
            accent
          />
          <StatCard
            label="Shopping"
            value={`${shoppingDone}/${shopping.length}`}
            sub="items purchased"
            icon={ShoppingBag}
          />
          <StatCard
            label="Activities"
            value={`${completed}/${total}`}
            sub={`${completionPct}% complete`}
            icon={CheckCircle2}
          />
        </div>
      </FadeIn>

      {/* Quick links */}
      <FadeIn delay={0.2} className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <QuickLink href="/itinerary" icon={CalendarClock} label="Itinerary" />
        <QuickLink href="/tickets" icon={CircleDot} label="Tickets" />
        <QuickLink href="/flights" icon={Plane} label="Flights" />
        <QuickLink href="/budget" icon={Wallet} label="Budget" />
      </FadeIn>
    </>
  );
}

function UpcomingCard({
  activity,
  ticket,
}: {
  activity: ReturnType<typeof getCurrentAndNext>["next"];
  ticket: ActivityTicket | null;
}) {
  if (!activity) return null;
  const Icon = transportInfo(activity.transport).icon;

  return (
    <motion.div whileHover={{ y: -3 }}>
      <Card gold className="p-0">
        <div className="flex items-start gap-4 p-5">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-black/30 text-2xl">
            {activity.emoji ?? "📍"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-serif text-xl font-semibold">
                {activity.title}
              </h3>
              <Badge>Next up</Badge>
            </div>
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-3.5 text-gold-400" />
              {activity.location}
            </p>
          </div>
          <TicketAccess ticket={ticket} title={activity.title} />
        </div>
        <div className="grid grid-cols-2 gap-px overflow-hidden border-t border-white/10 bg-white/5 sm:grid-cols-4">
          <Cell label="Start" value={formatTime(activity.startTime)} />
          <Cell label="End" value={formatTime(activity.endTime)} />
          <Cell
            label="Duration"
            value={durationLabel(activity.startTime, activity.endTime)}
          />
          <Cell
            label="Transport"
            value={
              <span className="inline-flex items-center gap-1">
                <Icon className="size-3.5 text-gold-400" />
                {transportInfo(activity.transport).label}
              </span>
            }
          />
        </div>
        {activity.notes && (
          <div className="border-t border-white/10 px-5 py-3 text-sm text-muted-foreground">
            <span className="text-gold-300">Note · </span>
            {activity.notes}
          </div>
        )}
      </Card>
    </motion.div>
  );
}

function TicketAccess({
  ticket,
  title,
  compact,
}: {
  ticket: ActivityTicket | null;
  title: string;
  compact?: boolean;
}) {
  const [qrOpen, setQrOpen] = React.useState(false);
  const [pdfOpen, setPdfOpen] = React.useState(false);
  const qrItems = getQrItems(ticket);

  if (qrItems.length === 0 && !ticket?.pdfUrl) return null;

  return (
    <>
      <div className="shrink-0 flex flex-col items-center gap-1">
        {qrItems.length > 0 && (
          <button
            type="button"
            onClick={() => setQrOpen(true)}
            className="flex flex-col items-center gap-1"
            title="Tap to enlarge"
          >
            <div
              className={cn(
                "grid max-w-[132px] gap-1",
                qrItems.length > 1 ? "grid-cols-2" : "grid-cols-1"
              )}
            >
              {qrItems.map((q, i) => (
                <QrThumb
                  key={i}
                  item={q}
                  size={compact ? (qrItems.length > 1 ? 48 : 64) : qrItems.length > 1 ? 52 : 80}
                />
              ))}
            </div>
            <span className="text-[10px] text-gold-300">
              {qrItems.length > 1
                ? `Tap to view ${qrItems.length} codes`
                : "Tap to view"}
            </span>
          </button>
        )}

        {ticket?.pdfUrl && (
          <button
            type="button"
            onClick={() => setPdfOpen(true)}
            className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] font-medium text-gold-300 transition-colors hover:border-gold/50 hover:bg-gold/10"
          >
            View full PDF
          </button>
        )}
      </div>

      <Modal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        title={title}
      >
        <div className="space-y-4">
          <div
            className={cn(
              "grid gap-3",
              qrItems.length > 1 ? "grid-cols-2" : "grid-cols-1"
            )}
          >
            {qrItems.map((q, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.02] p-3"
              >
                <QrThumb item={q} size={qrItems.length > 1 ? 150 : 240} large />
                <div className="flex items-center gap-1.5">
                  {q.format && <Badge variant="muted">{q.format}</Badge>}
                  {qrItems.length > 1 && (
                    <span className="text-[10px] text-muted-foreground">
                      #{i + 1}
                    </span>
                  )}
                </div>
                {q.text && (
                  <p
                    className="max-w-full break-all text-center text-[10px] text-muted-foreground"
                    title={q.text}
                  >
                    {q.text}
                  </p>
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground">
            {qrItems.length > 1
              ? `${qrItems.length} codes · show each at boarding / entry`
              : "Show this at boarding / entry"}
          </p>
          {ticket?.pdfUrl && (
            <button
              type="button"
              onClick={() => { setQrOpen(false); setPdfOpen(true); }}
              className="mx-auto inline-flex rounded-lg border border-gold/30 bg-gold/10 px-3 py-1.5 text-xs font-medium text-gold-200 hover:border-gold/60"
            >
              View full PDF
            </button>
          )}
        </div>
      </Modal>

      {ticket?.pdfUrl && (
        <PdfViewer
          open={pdfOpen}
          onClose={() => setPdfOpen(false)}
          url={ticket.pdfUrl}
        />
      )}
    </>
  );
}

function QrThumb({
  item,
  size,
  large,
}: {
  item: { imageUrl?: string; data?: string };
  size: number;
  large?: boolean;
}) {
  if (item.imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.imageUrl}
        alt="Ticket code"
        style={{ width: size, height: size }}
        className={cn(
          "rounded-lg border border-white/10 bg-white object-contain",
          large ? "p-2" : "p-1"
        )}
      />
    );
  }
  if (item.data) {
    return <QRCode data={item.data} size={size} />;
  }
  return null;
}

function Cell({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="bg-[#0d0d0f] px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.97 }}
        className="glass flex items-center gap-3 rounded-2xl p-4 transition-colors hover:bg-white/[0.07]"
      >
        <div className="flex size-9 items-center justify-center rounded-xl glass-gold">
          <Icon className="size-4 text-gold-300" />
        </div>
        <span className="text-sm font-medium">{label}</span>
        <ArrowRight className="ml-auto size-4 text-muted-foreground" />
      </motion.div>
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-48 animate-pulse rounded-xl bg-white/5" />
      <div className="h-40 animate-pulse rounded-2xl bg-white/5" />
      <div className="h-36 animate-pulse rounded-2xl bg-white/5" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/5" />
        ))}
      </div>
    </div>
  );
}
