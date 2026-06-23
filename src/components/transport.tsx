import {
  Footprints,
  Car,
  Ship,
  Plane,
  Bus,
  TramFront,
  Bike,
  Sailboat,
  type LucideIcon,
} from "lucide-react";
import type { TransportMode } from "@/lib/types";

const map: Record<TransportMode, { icon: LucideIcon; label: string }> = {
  walk: { icon: Footprints, label: "Walk" },
  car: { icon: Car, label: "Car" },
  taxi: { icon: Car, label: "Taxi / Grab" },
  tuktuk: { icon: Bike, label: "Tuk-tuk" },
  boat: { icon: Sailboat, label: "Boat" },
  ferry: { icon: Ship, label: "Ferry" },
  flight: { icon: Plane, label: "Flight" },
  bus: { icon: Bus, label: "Bus" },
  metro: { icon: TramFront, label: "BTS / Metro" },
};

export function transportInfo(mode: TransportMode) {
  return map[mode] ?? map.car;
}

export function TransportBadge({ mode }: { mode: TransportMode }) {
  const { icon: Icon, label } = transportInfo(mode);
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <Icon className="size-3.5 text-gold-400" />
      {label}
    </span>
  );
}
