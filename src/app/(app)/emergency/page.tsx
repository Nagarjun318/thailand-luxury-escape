"use client";

import { motion } from "framer-motion";
import {
  LifeBuoy,
  Phone,
  ShieldAlert,
  Ambulance,
  Building2,
  BedDouble,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useTripStore } from "@/lib/store";
import { PageHeader, FadeIn } from "@/components/common";
import { Card } from "@/components/ui/card";
import type { EmergencyContact } from "@/lib/types";

const CATEGORY_META: Record<
  EmergencyContact["category"],
  { icon: LucideIcon; label: string }
> = {
  Police: { icon: ShieldAlert, label: "Police & Tourist Police" },
  Emergency: { icon: Ambulance, label: "Emergency Services" },
  Embassy: { icon: Building2, label: "Embassy" },
  Hotel: { icon: BedDouble, label: "Hotel Contacts" },
  Family: { icon: Users, label: "Family Contacts" },
};

const ORDER: EmergencyContact["category"][] = [
  "Police",
  "Emergency",
  "Embassy",
  "Hotel",
  "Family",
];

export default function EmergencyPage() {
  const emergencyContacts = useTripStore((s) => s.emergency);
  return (
    <>
      <PageHeader
        title="Emergency"
        subtitle="Quick access when it matters most"
        icon={LifeBuoy}
      />

      <FadeIn className="mb-6">
        <Card gold className="flex items-center gap-4 p-5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/15">
            <ShieldAlert className="size-6 text-red-400" />
          </div>
          <div>
            <p className="font-serif text-base font-semibold">
              In any emergency, dial 191
            </p>
            <p className="text-sm text-muted-foreground">
              Tourist Police (English): 1155 · Medical: 1669
            </p>
          </div>
        </Card>
      </FadeIn>

      <div className="space-y-5">
        {ORDER.map((category, idx) => {
          const contacts = emergencyContacts.filter(
            (c) => c.category === category
          );
          if (contacts.length === 0) return null;
          const { icon: Icon, label } = CATEGORY_META[category];
          return (
            <FadeIn key={category} delay={idx * 0.05}>
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Icon className="size-4 text-gold-400" />
                  <h2 className="font-serif text-base font-semibold">
                    {label}
                  </h2>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {contacts.map((c) => (
                    <motion.a
                      key={c.id}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      href={`tel:${c.phone.replace(/\s/g, "")}`}
                    >
                      <Card className="flex items-center gap-3 p-4">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10">
                          <Phone className="size-4 text-emerald-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {c.label}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {c.name}
                          </p>
                        </div>
                        <span className="font-mono text-sm font-semibold gold-text">
                          {c.phone}
                        </span>
                      </Card>
                    </motion.a>
                  ))}
                </div>
              </div>
            </FadeIn>
          );
        })}
      </div>
    </>
  );
}
