"use client";

import * as React from "react";
import { ArrowLeftRight, RefreshCw, Coins } from "lucide-react";
import { useTripStore } from "@/lib/store";
import { PageHeader, FadeIn, useMounted } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatINR, formatTHB } from "@/lib/utils";

export default function CurrencyPage() {
  const mounted = useMounted();
  const { settings, setRate } = useTripStore();
  const [thb, setThb] = React.useState("100");
  const [inr, setInr] = React.useState("");
  const [rateInput, setRateInput] = React.useState("");

  React.useEffect(() => {
    if (mounted) {
      setRateInput(String(settings.thbToInr));
      setInr(String(Math.round(100 * settings.thbToInr)));
    }
  }, [mounted, settings.thbToInr]);

  if (!mounted) return null;

  const rate = settings.thbToInr;

  const onThb = (v: string) => {
    setThb(v);
    const n = parseFloat(v);
    setInr(isNaN(n) ? "" : String(Math.round(n * rate)));
  };
  const onInr = (v: string) => {
    setInr(v);
    const n = parseFloat(v);
    setThb(isNaN(n) ? "" : String(Math.round((n / rate) * 100) / 100));
  };

  const applyRate = () => {
    const r = parseFloat(rateInput);
    if (!isNaN(r) && r > 0) {
      setRate(r);
      const n = parseFloat(thb);
      if (!isNaN(n)) setInr(String(Math.round(n * r)));
    }
  };

  const quick = [100, 500, 1000, 2000, 5000];

  return (
    <>
      <PageHeader
        title="Currency Converter"
        subtitle="Offline THB ↔ INR"
        icon={ArrowLeftRight}
        action={
          <Badge variant="default">
            <Coins className="size-3" /> 1 THB = ₹{rate}
          </Badge>
        }
      />

      <FadeIn>
        <Card gold className="p-6">
          <div className="grid items-end gap-4 sm:grid-cols-[1fr_auto_1fr]">
            <div className="space-y-1.5">
              <Label>Thai Baht (THB)</Label>
              <Input
                type="number"
                inputMode="decimal"
                value={thb}
                onChange={(e) => onThb(e.target.value)}
                className="h-14 text-lg font-semibold"
              />
            </div>
            <div className="mx-auto flex size-11 items-center justify-center rounded-full glass-gold sm:mb-1">
              <ArrowLeftRight className="size-5 text-gold-300" />
            </div>
            <div className="space-y-1.5">
              <Label>Indian Rupee (INR)</Label>
              <Input
                type="number"
                inputMode="decimal"
                value={inr}
                onChange={(e) => onInr(e.target.value)}
                className="h-14 text-lg font-semibold"
              />
            </div>
          </div>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            {formatTHB(parseFloat(thb) || 0)} ={" "}
            <span className="text-gold-300">
              {formatINR(parseFloat(inr) || 0)}
            </span>
          </p>
        </Card>
      </FadeIn>

      <FadeIn delay={0.05} className="mt-4">
        <Card className="p-5">
          <p className="mb-3 text-sm font-medium">Quick amounts (THB)</p>
          <div className="flex flex-wrap gap-2">
            {quick.map((q) => (
              <button
                key={q}
                onClick={() => onThb(String(q))}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm transition-colors hover:border-gold/40 hover:bg-gold/10"
              >
                ฿{q.toLocaleString()}
                <span className="ml-2 text-xs text-muted-foreground">
                  ₹{Math.round(q * rate).toLocaleString()}
                </span>
              </button>
            ))}
          </div>
        </Card>
      </FadeIn>

      <FadeIn delay={0.1} className="mt-4">
        <Card className="p-5">
          <Label>Exchange rate (1 THB → INR)</Label>
          <div className="mt-2 flex gap-2">
            <Input
              type="number"
              step="0.01"
              value={rateInput}
              onChange={(e) => setRateInput(e.target.value)}
              className="flex-1"
            />
            <Button onClick={applyRate}>
              <RefreshCw className="size-4" /> Update
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            The rate is saved locally and used across budget, shopping and
            analytics.
          </p>
        </Card>
      </FadeIn>
    </>
  );
}
