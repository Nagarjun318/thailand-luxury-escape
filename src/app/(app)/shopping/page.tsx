"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  Plus,
  Trash2,
  Pencil,
  Check,
  Coins,
  Target,
} from "lucide-react";
import { useTripStore } from "@/lib/store";
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
import { Progress } from "@/components/ui/progress";
import { Input, Label, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/drawer";
import { formatTHB, formatINR, thbToInr, pct, cn } from "@/lib/utils";
import type { ShoppingItem, ShoppingPriority } from "@/lib/types";

const PRIORITIES: ShoppingPriority[] = ["High", "Medium", "Low"];
const PRIORITY_VARIANT: Record<
  ShoppingPriority,
  "danger" | "warning" | "muted"
> = {
  High: "danger",
  Medium: "warning",
  Low: "muted",
};

export default function ShoppingPage() {
  const mounted = useMounted();
  const {
    shopping,
    settings,
    addShopping,
    updateShopping,
    deleteShopping,
    toggleShopping,
  } = useTripStore();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ShoppingItem | null>(null);

  if (!mounted) return null;

  const totalBudget = shopping.reduce((s, i) => s + i.budgetTHB, 0);
  const totalSpent = shopping.reduce((s, i) => s + i.actualTHB, 0);
  const purchased = shopping.filter((i) => i.purchased).length;
  const completion = pct(purchased, shopping.length);
  const remaining = Math.max(0, totalBudget - totalSpent);

  const sorted = [...shopping].sort((a, b) => {
    const order = { High: 0, Medium: 1, Low: 2 };
    if (a.purchased !== b.purchased) return a.purchased ? 1 : -1;
    return order[a.priority] - order[b.priority];
  });

  return (
    <>
      <PageHeader
        title="Shopping Planner"
        subtitle="Plan the haul, track the spend"
        icon={ShoppingBag}
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus /> Add Item
          </Button>
        }
      />

      <FadeIn className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Planned Budget" value={formatTHB(totalBudget)} icon={Target} />
        <StatCard
          label="Actual Spend"
          value={formatTHB(totalSpent)}
          sub={formatINR(thbToInr(totalSpent, settings.thbToInr))}
          icon={Coins}
        />
        <StatCard label="Remaining" value={formatTHB(remaining)} accent />
        <StatCard
          label="Completion"
          value={`${completion}%`}
          sub={`${purchased}/${shopping.length} bought`}
        />
      </FadeIn>

      <FadeIn delay={0.05} className="mb-5">
        <Card className="p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Shopping completion</span>
            <span className="font-medium gold-text">{completion}%</span>
          </div>
          <Progress value={completion} className="h-3" />
        </Card>
      </FadeIn>

      {sorted.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Nothing on the list"
          description="Add things you plan to shop for in Thailand."
        />
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {sorted.map((item) => {
              const over = item.actualTHB > item.budgetTHB;
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Card
                    className={cn(
                      "p-4",
                      item.purchased && "opacity-70"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleShopping(item.id)}
                        className={cn(
                          "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg border transition-colors",
                          item.purchased
                            ? "border-emerald-400 bg-emerald-400 text-black"
                            : "border-white/20 hover:border-gold/50"
                        )}
                        aria-label="Toggle purchased"
                      >
                        {item.purchased && <Check className="size-4" />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={cn(
                              "font-medium",
                              item.purchased && "line-through text-muted-foreground"
                            )}
                          >
                            {item.name}
                          </p>
                          <Badge variant={PRIORITY_VARIANT[item.priority]}>
                            {item.priority}
                          </Badge>
                        </div>
                        {item.notes && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {item.notes}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                          <span className="text-muted-foreground">
                            Budget:{" "}
                            <span className="text-foreground">
                              {formatTHB(item.budgetTHB)}
                            </span>
                          </span>
                          <span className="text-muted-foreground">
                            Spent:{" "}
                            <span
                              className={cn(
                                over ? "text-red-400" : "text-foreground"
                              )}
                            >
                              {formatTHB(item.actualTHB)}
                            </span>
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => {
                            setEditing(item);
                            setOpen(true);
                          }}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground"
                          aria-label="Edit"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          onClick={() => deleteShopping(item.id)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-400"
                          aria-label="Delete"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <ShoppingModal
        open={open}
        onClose={() => setOpen(false)}
        editing={editing}
        onSave={(data) => {
          if (editing) updateShopping(editing.id, data);
          else addShopping(data);
          setOpen(false);
        }}
      />
    </>
  );
}

function ShoppingModal({
  open,
  onClose,
  editing,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  editing: ShoppingItem | null;
  onSave: (data: Omit<ShoppingItem, "id">) => void;
}) {
  const [name, setName] = React.useState("");
  const [priority, setPriority] = React.useState<ShoppingPriority>("Medium");
  const [budget, setBudget] = React.useState("");
  const [actual, setActual] = React.useState("");
  const [purchased, setPurchased] = React.useState(false);
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setName(editing?.name ?? "");
      setPriority(editing?.priority ?? "Medium");
      setBudget(editing ? String(editing.budgetTHB) : "");
      setActual(editing ? String(editing.actualTHB) : "0");
      setPurchased(editing?.purchased ?? false);
      setNotes(editing?.notes ?? "");
    }
  }, [open, editing]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      priority,
      budgetTHB: parseFloat(budget) || 0,
      actualTHB: parseFloat(actual) || 0,
      purchased,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit Item" : "Add Item"}>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label>Item name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Thai silk scarf"
            autoFocus
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Select
              value={priority}
              onChange={(e) =>
                setPriority(e.target.value as ShoppingPriority)
              }
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Budget (THB)</Label>
            <Input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Actual spend (THB)</Label>
            <Input
              type="number"
              value={actual}
              onChange={(e) => setActual(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => setPurchased((p) => !p)}
              className={cn(
                "flex h-10 w-full items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-colors",
                purchased
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                  : "border-white/10 text-muted-foreground"
              )}
            >
              <Check className="size-4" />
              {purchased ? "Purchased" : "Mark bought"}
            </button>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Notes (optional)</Label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Where to buy, size, etc."
          />
        </div>
        <div className="flex gap-2 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1">
            {editing ? "Save" : "Add Item"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
