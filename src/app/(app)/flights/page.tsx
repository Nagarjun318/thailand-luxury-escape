"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Plane,
  PlaneTakeoff,
  PlaneLanding,
  Armchair,
  Building2,
  Ticket as TicketIcon,
  ArrowRight,
} from "lucide-react";
import { useTripStore } from "@/lib/store";
import { PageHeader, FadeIn } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { QRCode } from "@/components/qr-code";
import { formatTime, formatDate, durationLabel } from "@/lib/utils";
import type { Flight } from "@/lib/types";

export default function FlightsPage() {
  const flights = useTripStore((s) => s.flights);
  const [active, setActive] = React.useState<Flight | null>(null);

  return (
    <>
      <PageHeader
        title="Flights"
        subtitle="AirAsia · Chennai ⇄ Bangkok"
        icon={Plane}
      />

      <div className="space-y-5">
        {flights.map((f, i) => (
          <FadeIn key={f.id} delay={i * 0.08}>
            <FlightCard flight={f} onView={() => setActive(f)} />
          </FadeIn>
        ))}
      </div>

      <Drawer
        open={!!active}
        onClose={() => setActive(null)}
        title={active ? `${active.airline} ${active.flightNumber}` : undefined}
        description={active ? `${active.fromCode} → ${active.toCode}` : undefined}
      >
        {active && (
          <div className="space-y-5">
            <div className="flex flex-col items-center gap-3">
              <QRCode data={`FLIGHT|${active.flightNumber}|${active.bookingNumber}`} />
              <p className="text-xs text-muted-foreground">Boarding pass QR</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Booking" value={`#${active.bookingNumber}`} />
              <Field label="Seat" value={active.seat} />
              <Field label="Terminal" value={active.terminal} />
              <Field label="Status" value={active.status} />
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}

function FlightCard({
  flight,
  onView,
}: {
  flight: Flight;
  onView: () => void;
}) {
  const Icon = flight.type === "Outbound" ? PlaneTakeoff : PlaneLanding;
  return (
    <motion.div whileHover={{ y: -3 }}>
      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <div className="flex items-center gap-2">
            <Icon className="size-4 text-gold-400" />
            <span className="text-sm font-medium">{flight.type}</span>
            <Badge variant="secondary">
              {flight.airline} {flight.flightNumber}
            </Badge>
          </div>
          <Badge variant="success">{flight.status}</Badge>
        </div>

        <div className="flex items-center justify-between gap-3 p-5">
          <div className="text-center">
            <p className="font-serif text-2xl font-bold gold-text">
              {flight.fromCode}
            </p>
            <p className="mt-1 text-sm font-medium">
              {formatTime(flight.departure)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDate(flight.departure)}
            </p>
            <p className="text-xs text-muted-foreground">{flight.from}</p>
          </div>

          <div className="flex flex-1 flex-col items-center">
            <p className="text-[11px] text-muted-foreground">
              {durationLabel(flight.departure, flight.arrival)}
            </p>
            <div className="my-1 flex w-full items-center gap-1">
              <span className="size-1.5 rounded-full bg-gold-400" />
              <span className="h-px flex-1 bg-gradient-to-r from-gold-400/60 to-gold-400/60" />
              <Plane className="size-3.5 text-gold-400" />
              <span className="h-px flex-1 bg-gradient-to-r from-gold-400/60 to-gold-400/60" />
              <span className="size-1.5 rounded-full bg-gold-400" />
            </div>
            <p className="text-[11px] text-muted-foreground">Non-stop</p>
          </div>

          <div className="text-center">
            <p className="font-serif text-2xl font-bold gold-text">
              {flight.toCode}
            </p>
            <p className="mt-1 text-sm font-medium">
              {formatTime(flight.arrival)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDate(flight.arrival)}
            </p>
            <p className="text-xs text-muted-foreground">{flight.to}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-white/10 px-5 py-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Armchair className="size-3.5 text-gold-400" /> Seat {flight.seat}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Building2 className="size-3.5 text-gold-400" /> {flight.terminal}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={onView}
          >
            <TicketIcon className="size-4" /> View pass
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white/[0.03] p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
