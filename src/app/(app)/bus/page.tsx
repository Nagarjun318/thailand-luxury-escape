"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Bus,
  Armchair,
  Clock,
  Info,
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
import { formatTime, formatDate, minsToLabel } from "@/lib/utils";
import type { BusTicket } from "@/lib/types";

export default function BusPage() {
  const buses = useTripStore((s) => s.buses);
  const [active, setActive] = React.useState<BusTicket | null>(null);

  return (
    <>
      <PageHeader
        title="Bus Transfers"
        subtitle="Airport & intercity coaches"
        icon={Bus}
      />

      <div className="space-y-5">
        {buses.map((b, i) => (
          <FadeIn key={b.id} delay={i * 0.08}>
            <motion.div whileHover={{ y: -3 }}>
              <Card className="overflow-hidden p-0">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
                  <div className="flex items-center gap-2">
                    <Bus className="size-4 text-gold-400" />
                    <span className="font-serif text-sm font-semibold">
                      {b.route}
                    </span>
                  </div>
                  <Badge variant="success">{b.status}</Badge>
                </div>

                <div className="flex items-center justify-between gap-3 p-5">
                  <div className="text-center">
                    <p className="text-sm font-medium">{formatTime(b.departure)}</p>
                    <p className="text-xs text-muted-foreground">{b.from}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatDate(b.departure)}
                    </p>
                  </div>
                  <div className="flex flex-1 flex-col items-center">
                    <p className="text-[11px] text-muted-foreground">
                      {minsToLabel(b.durationMins)}
                    </p>
                    <div className="my-1 flex w-full items-center gap-1">
                      <span className="size-1.5 rounded-full bg-gold-400" />
                      <span className="h-px flex-1 bg-gold-400/50" />
                      <Bus className="size-3.5 text-gold-400" />
                      <span className="h-px flex-1 bg-gold-400/50" />
                      <span className="size-1.5 rounded-full bg-gold-400" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{formatTime(b.arrival)}</p>
                    <p className="text-xs text-muted-foreground">{b.to}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatDate(b.arrival)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-white/10 px-5 py-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <TicketIcon className="size-3.5 text-gold-400" /> #
                    {b.bookingNumber}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Armchair className="size-3.5 text-gold-400" /> Seat {b.seat}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto"
                    onClick={() => setActive(b)}
                  >
                    <TicketIcon className="size-4" /> View ticket
                    <ArrowRight className="size-3.5" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          </FadeIn>
        ))}
      </div>

      <Drawer
        open={!!active}
        onClose={() => setActive(null)}
        title={active?.route}
        description={active ? `Booking #${active.bookingNumber}` : undefined}
      >
        {active && (
          <div className="space-y-5">
            <div className="flex flex-col items-center gap-3">
              <QRCode data={`BUS|${active.route}|${active.bookingNumber}|${active.seat}`} />
              <p className="text-xs text-muted-foreground">
                Show at boarding gate
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Field
                label="Departure"
                value={`${formatTime(active.departure)} · ${formatDate(active.departure)}`}
              />
              <Field
                label="Arrival"
                value={`${formatTime(active.arrival)} · ${formatDate(active.arrival)}`}
              />
              <Field label="Duration" value={minsToLabel(active.durationMins)} />
              <Field label="Seat" value={active.seat} />
            </div>
            <div className="flex items-start gap-2 rounded-xl bg-white/[0.03] p-3 text-sm text-muted-foreground">
              <Info className="mt-0.5 size-4 shrink-0 text-gold-400" />
              <span>
                <span className="text-gold-300">Boarding · </span>
                {active.boardingInstructions}
              </span>
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white/[0.03] p-3">
      <p className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-muted-foreground">
        <Clock className="size-3 text-gold-400" /> {label}
      </p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
