"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Luggage,
  Check,
  FileText,
  Smartphone,
  Shirt,
  Bath,
  Pill,
  Glasses,
  type LucideIcon,
} from "lucide-react";
import { useTripStore } from "@/lib/store";
import { PageHeader, FadeIn, useMounted } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressRing } from "@/components/progress-ring";
import { pct, cn } from "@/lib/utils";
import type { PackingItem } from "@/lib/types";

const CATEGORY_META: Record<
  PackingItem["category"],
  { icon: LucideIcon }
> = {
  Documents: { icon: FileText },
  Electronics: { icon: Smartphone },
  Clothes: { icon: Shirt },
  Toiletries: { icon: Bath },
  Medicines: { icon: Pill },
  Accessories: { icon: Glasses },
};

const ORDER: PackingItem["category"][] = [
  "Documents",
  "Electronics",
  "Clothes",
  "Toiletries",
  "Medicines",
  "Accessories",
];

export default function PackingPage() {
  const mounted = useMounted();
  const { packing, togglePacking } = useTripStore();

  if (!mounted) return null;

  const packed = packing.filter((p) => p.packed).length;
  const completion = pct(packed, packing.length);

  return (
    <>
      <PageHeader
        title="Packing Checklist"
        subtitle="Don't leave anything behind"
        icon={Luggage}
      />

      <FadeIn className="mb-6">
        <Card gold className="flex flex-col items-center gap-5 p-6 sm:flex-row sm:justify-between">
          <div className="text-center sm:text-left">
            <h2 className="font-serif text-xl font-semibold">
              You&apos;re {completion}% packed
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {packed} of {packing.length} items ready to go
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              {completion === 100 ? (
                <Badge variant="success">
                  <Check className="size-3" /> All packed!
                </Badge>
              ) : (
                <Badge variant="warning">
                  {packing.length - packed} items left
                </Badge>
              )}
            </div>
          </div>
          <ProgressRing value={completion} size={140} sublabel="packed" />
        </Card>
      </FadeIn>

      <div className="grid gap-4 sm:grid-cols-2">
        {ORDER.map((category, idx) => {
          const items = packing.filter((p) => p.category === category);
          if (items.length === 0) return null;
          const done = items.filter((i) => i.packed).length;
          const Icon = CATEGORY_META[category].icon;
          return (
            <FadeIn key={category} delay={idx * 0.05}>
              <Card className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg glass-gold">
                      <Icon className="size-4 text-gold-300" />
                    </div>
                    <h3 className="font-serif text-base font-semibold">
                      {category}
                    </h3>
                  </div>
                  <Badge variant="secondary">
                    {done}/{items.length}
                  </Badge>
                </div>
                <div className="space-y-1">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => togglePacking(item.id)}
                      className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-white/[0.03]"
                    >
                      <span
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                          item.packed
                            ? "border-emerald-400 bg-emerald-400 text-black"
                            : "border-white/25"
                        )}
                      >
                        {item.packed && <Check className="size-3.5" />}
                      </span>
                      <span
                        className={cn(
                          "text-sm",
                          item.packed && "text-muted-foreground line-through"
                        )}
                      >
                        {item.name}
                      </span>
                    </button>
                  ))}
                </div>
              </Card>
            </FadeIn>
          );
        })}
      </div>
    </>
  );
}
