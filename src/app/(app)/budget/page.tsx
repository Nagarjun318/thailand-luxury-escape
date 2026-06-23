"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  Wallet,
  Plus,
  Search,
  Trash2,
  Pencil,
  Coins,
  TrendingDown,
  Banknote,
  CalendarDays,
} from "lucide-react";
import { useTripStore } from "@/lib/store";
import { trip } from "@/lib/seed";
import {
  PageHeader,
  FadeIn,
  StatCard,
  useMounted,
  EmptyState,
} from "@/components/common";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/drawer";
import {
  formatTHB,
  formatINR,
  thbToInr,
  formatDate,
  cn,
} from "@/lib/utils";
import type { Expense, ExpenseCategory } from "@/lib/types";

const CATEGORIES: ExpenseCategory[] = [
  "Food",
  "Transport",
  "Shopping",
  "Attractions",
  "Misc",
  "Emergency",
];

const CATEGORY_COLOR: Record<ExpenseCategory, string> = {
  Food: "#e3bd66",
  Transport: "#c8912a",
  Shopping: "#d9a83d",
  Attractions: "#a8741f",
  Misc: "#85591c",
  Emergency: "#ef4444",
};

export default function BudgetPage() {
  const mounted = useMounted();
  const { expenses, settings, addExpense, updateExpense, deleteExpense } =
    useTripStore();
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<"All" | ExpenseCategory>("All");
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Expense | null>(null);

  if (!mounted) return null;

  const totalSpend = expenses.reduce((s, e) => s + e.amountTHB, 0);
  const remaining = Math.max(0, trip.budgetTHB - totalSpend);
  const today = new Date();
  const todaySpend = expenses
    .filter((e) => {
      const d = new Date(e.date);
      return (
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate()
      );
    })
    .reduce((s, e) => s + e.amountTHB, 0);
  const remainingCashINR = Math.max(
    0,
    trip.budgetCashINR - thbToInr(totalSpend, settings.thbToInr)
  );

  const filtered = expenses
    .filter((e) => filter === "All" || e.category === filter)
    .filter(
      (e) =>
        e.title.toLowerCase().includes(query.toLowerCase()) ||
        e.category.toLowerCase().includes(query.toLowerCase())
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const byCategory = CATEGORIES.map((c) => ({
    name: c,
    value: expenses
      .filter((e) => e.category === c)
      .reduce((s, e) => s + e.amountTHB, 0),
  })).filter((d) => d.value > 0);

  const byDay = groupByDay(expenses);

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (e: Expense) => {
    setEditing(e);
    setModalOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Budget"
        subtitle="Track every baht of the escape"
        icon={Wallet}
        action={
          <Button onClick={openAdd}>
            <Plus /> Add Expense
          </Button>
        }
      />

      {/* Summary */}
      <FadeIn className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Today's Spend"
          value={formatTHB(todaySpend)}
          icon={CalendarDays}
        />
        <StatCard
          label="Total Spend"
          value={formatTHB(totalSpend)}
          sub={formatINR(thbToInr(totalSpend, settings.thbToInr))}
          icon={TrendingDown}
        />
        <StatCard
          label="Remaining Budget"
          value={formatTHB(remaining)}
          sub={`of ${formatTHB(trip.budgetTHB)}`}
          icon={Coins}
          accent
        />
        <StatCard
          label="Remaining Cash"
          value={formatINR(remainingCashINR)}
          sub={`of ${formatINR(trip.budgetCashINR)}`}
          icon={Banknote}
        />
      </FadeIn>

      {/* Charts */}
      <FadeIn delay={0.05} className="mb-5 grid gap-3 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-2 font-serif text-base font-semibold">
            Spend by Category
          </h3>
          {byCategory.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No expenses yet
            </p>
          ) : (
            <div className="flex items-center gap-4">
              <div className="h-44 w-44 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={byCategory}
                      dataKey="value"
                      innerRadius={42}
                      outerRadius={70}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {byCategory.map((d) => (
                        <Cell
                          key={d.name}
                          fill={CATEGORY_COLOR[d.name as ExpenseCategory]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-1.5">
                {byCategory.map((d) => (
                  <div
                    key={d.name}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="size-2.5 rounded-full"
                        style={{
                          background:
                            CATEGORY_COLOR[d.name as ExpenseCategory],
                        }}
                      />
                      {d.name}
                    </span>
                    <span className="text-muted-foreground">
                      {formatTHB(d.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="mb-2 font-serif text-base font-semibold">
            Daily Spend
          </h3>
          {byDay.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No expenses yet
            </p>
          ) : (
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byDay} margin={{ left: -20, top: 8 }}>
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
                    content={<ChartTooltip />}
                    cursor={{ fill: "rgba(212,175,55,0.08)" }}
                  />
                  <Bar
                    dataKey="value"
                    fill="#d4af37"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={36}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </FadeIn>

      {/* Search & filter */}
      <FadeIn delay={0.1} className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search expenses…"
            className="pl-9"
          />
        </div>
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          className="sm:w-44"
        >
          <option value="All">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </FadeIn>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No expenses found"
          description="Add your first expense to start tracking."
          action={
            <Button onClick={openAdd}>
              <Plus /> Add Expense
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {filtered.map((e) => (
              <motion.div
                key={e.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card className="flex items-center gap-3 p-3.5">
                  <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-semibold"
                    style={{
                      background: `${CATEGORY_COLOR[e.category]}22`,
                      color: CATEGORY_COLOR[e.category],
                    }}
                  >
                    {e.category.slice(0, 2)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{e.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.category} · {formatDate(e.date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {formatTHB(e.amountTHB)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatINR(thbToInr(e.amountTHB, settings.thbToInr))}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => openEdit(e)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground"
                      aria-label="Edit"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      onClick={() => deleteExpense(e.id)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-400"
                      aria-label="Delete"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <ExpenseModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editing}
        onSave={(data) => {
          if (editing) updateExpense(editing.id, data);
          else addExpense(data);
          setModalOpen(false);
        }}
      />
    </>
  );
}

function ExpenseModal({
  open,
  onClose,
  editing,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  editing: Expense | null;
  onSave: (data: Omit<Expense, "id">) => void;
}) {
  const [title, setTitle] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [category, setCategory] = React.useState<ExpenseCategory>("Food");
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setTitle(editing?.title ?? "");
      setAmount(editing ? String(editing.amountTHB) : "");
      setCategory(editing?.category ?? "Food");
      setNotes(editing?.notes ?? "");
    }
  }, [open, editing]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!title.trim() || isNaN(amt) || amt <= 0) return;
    onSave({
      title: title.trim(),
      amountTHB: amt,
      category,
      notes: notes.trim() || undefined,
      date: editing?.date ?? new Date().toISOString(),
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit Expense" : "Add Expense"}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label>Title</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Dinner at Asiatique"
            autoFocus
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Amount (THB)</Label>
            <Input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as ExpenseCategory)
              }
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Notes (optional)</Label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add a note"
          />
        </div>
        <div className="flex gap-2 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1">
            {editing ? "Save Changes" : "Add Expense"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-lg border border-white/10 bg-[#161618] px-3 py-1.5 text-xs shadow-xl">
      <p className="font-medium">{item.payload.name ?? item.payload.label}</p>
      <p className="text-gold-300">{formatTHB(item.value)}</p>
    </div>
  );
}

function groupByDay(expenses: Expense[]) {
  const map = new Map<string, number>();
  for (const e of expenses) {
    const key = new Date(e.date).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
    });
    map.set(key, (map.get(key) ?? 0) + e.amountTHB);
  }
  return Array.from(map.entries())
    .map(([label, value]) => ({ label, value }))
    .reverse();
}
