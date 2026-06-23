"use client";

import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  PolarAngleAxis,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  BarChart3,
  CheckCircle2,
  Wallet,
  Coins,
  ShoppingBag,
  ListChecks,
  TrendingUp,
} from "lucide-react";
import { useTripStore } from "@/lib/store";
import { trip } from "@/lib/seed";
import {
  PageHeader,
  FadeIn,
  StatCard,
  useMounted,
} from "@/components/common";
import { Card } from "@/components/ui/card";
import { ProgressRing } from "@/components/progress-ring";
import {
  formatTHB,
  formatINR,
  thbToInr,
  pct,
  formatDate,
} from "@/lib/utils";

export default function AnalyticsPage() {
  const mounted = useMounted();
  const { activities, expenses, shopping, packing, settings } = useTripStore();

  if (!mounted) return null;

  const completedActs = activities.filter((a) => a.completed).length;
  const remainingActs = activities.length - completedActs;
  const tripCompletion = pct(completedActs, activities.length);

  const totalSpend = expenses.reduce((s, e) => s + e.amountTHB, 0);
  const remainingBudget = Math.max(0, trip.budgetTHB - totalSpend);
  const spendPct = pct(totalSpend, trip.budgetTHB);

  const shoppingDone = shopping.filter((s) => s.purchased).length;
  const shoppingPct = pct(shoppingDone, shopping.length);

  const packed = packing.filter((p) => p.packed).length;
  const packingPct = pct(packed, packing.length);

  const radial = [
    { name: "Trip", value: tripCompletion, fill: "#d4af37" },
    { name: "Shopping", value: shoppingPct, fill: "#c8912a" },
    { name: "Packing", value: packingPct, fill: "#e3bd66" },
  ];

  const spendByDay = groupSpend(expenses);

  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle="The full picture of your escape"
        icon={BarChart3}
      />

      <FadeIn className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatCard
          label="Trip Completion"
          value={`${tripCompletion}%`}
          icon={TrendingUp}
          accent
        />
        <StatCard
          label="Money Spent"
          value={formatTHB(totalSpend)}
          sub={formatINR(thbToInr(totalSpend, settings.thbToInr))}
          icon={Wallet}
        />
        <StatCard
          label="Money Remaining"
          value={formatTHB(remainingBudget)}
          sub={`${100 - spendPct}% of budget`}
          icon={Coins}
        />
        <StatCard
          label="Shopping Done"
          value={`${shoppingPct}%`}
          sub={`${shoppingDone}/${shopping.length} items`}
          icon={ShoppingBag}
        />
        <StatCard
          label="Activities Completed"
          value={completedActs}
          icon={CheckCircle2}
        />
        <StatCard
          label="Activities Remaining"
          value={remainingActs}
          icon={ListChecks}
        />
      </FadeIn>

      <div className="grid gap-3 lg:grid-cols-2">
        <FadeIn delay={0.05}>
          <Card className="p-5">
            <h3 className="mb-2 font-serif text-base font-semibold">
              Completion Overview
            </h3>
            <div className="flex items-center gap-4">
              <div className="h-48 flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    innerRadius="35%"
                    outerRadius="100%"
                    data={radial}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <PolarAngleAxis
                      type="number"
                      domain={[0, 100]}
                      tick={false}
                    />
                    <RadialBar background dataKey="value" cornerRadius={8} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {radial.map((r) => (
                  <div key={r.name} className="flex items-center gap-2 text-sm">
                    <span
                      className="size-3 rounded-full"
                      style={{ background: r.fill }}
                    />
                    <span className="text-muted-foreground">{r.name}</span>
                    <span className="font-medium">{r.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </FadeIn>

        <FadeIn delay={0.1}>
          <Card className="flex flex-col items-center justify-center gap-3 p-5">
            <h3 className="self-start font-serif text-base font-semibold">
              Budget Used
            </h3>
            <ProgressRing
              value={spendPct}
              size={150}
              label={`${spendPct}%`}
              sublabel="of budget"
            />
            <p className="text-sm text-muted-foreground">
              {formatTHB(totalSpend)} of {formatTHB(trip.budgetTHB)}
            </p>
          </Card>
        </FadeIn>
      </div>

      <FadeIn delay={0.15} className="mt-3">
        <Card className="p-5">
          <h3 className="mb-3 font-serif text-base font-semibold">
            Spending Trend
          </h3>
          {spendByDay.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No expenses recorded yet
            </p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={spendByDay} margin={{ left: -18, top: 8 }}>
                  <defs>
                    <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#d4af37" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#d4af37" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.06)"
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#9ca3af", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#9ca3af", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }: any) =>
                      active && payload?.length ? (
                        <div className="rounded-lg border border-white/10 bg-[#161618] px-3 py-1.5 text-xs">
                          <p className="font-medium">{payload[0].payload.label}</p>
                          <p className="text-gold-300">
                            {formatTHB(payload[0].value)}
                          </p>
                        </div>
                      ) : null
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#d4af37"
                    strokeWidth={2}
                    fill="url(#spendGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </FadeIn>
    </>
  );
}

function groupSpend(expenses: { date: string; amountTHB: number }[]) {
  const map = new Map<string, number>();
  for (const e of expenses) {
    const key = formatDate(e.date);
    map.set(key, (map.get(key) ?? 0) + e.amountTHB);
  }
  return Array.from(map.entries())
    .map(([label, value]) => ({ label, value }))
    .reverse();
}
