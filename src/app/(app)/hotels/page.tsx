"use client";

import { motion } from "framer-motion";
import {
  BedDouble,
  MapPin,
  Phone,
  LogIn,
  LogOut,
  ExternalLink,
  StickyNote,
} from "lucide-react";
import { useTripStore } from "@/lib/store";
import { PageHeader, FadeIn } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateLong, formatTime } from "@/lib/utils";

export default function HotelsPage() {
  const hotels = useTripStore((s) => s.hotels);
  return (
    <>
      <PageHeader
        title="Hotels"
        subtitle="Your stays in Pattaya & Bangkok"
        icon={BedDouble}
      />

      <div className="space-y-5">
        {hotels.map((hotel, i) => (
          <FadeIn key={hotel.id} delay={i * 0.08}>
            <motion.div whileHover={{ y: -3 }}>
              <Card className="overflow-hidden p-0">
                {hotel.image && (
                  <div className="relative h-44 w-full overflow-hidden sm:h-52">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={hotel.image}
                      alt={hotel.name}
                      className="size-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                      <div>
                        <Badge variant="default" className="mb-1.5">
                          {hotel.city}
                        </Badge>
                        <h2 className="font-serif text-xl font-semibold drop-shadow">
                          {hotel.name}
                        </h2>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4 p-5">
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-gold-400" />
                    {hotel.address}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-white/[0.03] p-3">
                      <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                        <LogIn className="size-3.5 text-emerald-400" /> Check-in
                      </p>
                      <p className="mt-1 text-sm font-medium">
                        {formatDateLong(hotel.checkIn)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        from {formatTime(hotel.checkIn)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white/[0.03] p-3">
                      <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                        <LogOut className="size-3.5 text-red-400" /> Check-out
                      </p>
                      <p className="mt-1 text-sm font-medium">
                        {formatDateLong(hotel.checkOut)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        by {formatTime(hotel.checkOut)}
                      </p>
                    </div>
                  </div>

                  {hotel.notes && (
                    <p className="flex items-start gap-2 rounded-xl bg-white/[0.03] p-3 text-sm text-muted-foreground">
                      <StickyNote className="mt-0.5 size-4 shrink-0 text-gold-400" />
                      {hotel.notes}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <a href={`tel:${hotel.phone.replace(/\s/g, "")}`}>
                      <Button variant="secondary" size="sm">
                        <Phone className="size-4" /> Call
                      </Button>
                    </a>
                    <a
                      href={hotel.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        <ExternalLink className="size-4" /> Google Maps
                      </Button>
                    </a>
                  </div>
                </div>
              </Card>
            </motion.div>
          </FadeIn>
        ))}
      </div>
    </>
  );
}
