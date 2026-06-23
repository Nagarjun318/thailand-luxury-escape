"use client";

import * as React from "react";
import {
  Settings as SettingsIcon,
  Download,
  Upload,
  RotateCcw,
  ClipboardCopy,
  ClipboardPaste,
  Sun,
  Moon,
  Check,
  TriangleAlert,
  Coins,
} from "lucide-react";
import { useTripStore } from "@/lib/store";
import { trip } from "@/lib/seed";
import { PageHeader, FadeIn, useMounted } from "@/components/common";
import { TimeZoneToggle } from "@/components/timezone-toggle";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const mounted = useMounted();
  const store = useTripStore();
  const { settings, updateSettings, setRate, exportData, importData, resetTrip } =
    store;

  const [toast, setToast] = React.useState<string | null>(null);
  const [restoreText, setRestoreText] = React.useState("");
  const [confirmReset, setConfirmReset] = React.useState(false);
  const [rate, setRateInput] = React.useState("");
  const fileRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (mounted) setRateInput(String(settings.thbToInr));
  }, [mounted, settings.thbToInr]);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  if (!mounted) return null;

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `thailand-escape-backup-${
      new Date().toISOString().split("T")[0]
    }.json`;
    a.click();
    URL.revokeObjectURL(url);
    updateSettings({ lastBackup: new Date().toISOString() });
    flash("Backup exported");
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importData(reader.result as string);
      flash(ok ? "Data imported successfully" : "Invalid backup file");
    };
    reader.readAsText(file);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportData());
      flash("Backup copied to clipboard");
    } catch {
      flash("Clipboard not available");
    }
  };

  const handleRestore = () => {
    if (!restoreText.trim()) return;
    const ok = importData(restoreText.trim());
    flash(ok ? "Data restored" : "Invalid JSON");
    if (ok) setRestoreText("");
  };

  const applyRate = () => {
    const r = parseFloat(rate);
    if (!isNaN(r) && r > 0) {
      setRate(r);
      flash("Exchange rate updated");
    }
  };

  const toggleTheme = () => {
    const next = settings.theme === "dark" ? "light" : "dark";
    updateSettings({ theme: next });
    document.documentElement.classList.toggle("light", next === "light");
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Personalise, back up and restore your trip"
        icon={SettingsIcon}
      />

      {/* Appearance */}
      <FadeIn className="mb-4">
        <Card className="p-5">
          <h2 className="mb-3 font-serif text-base font-semibold">Appearance</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Theme</p>
              <p className="text-xs text-muted-foreground">
                Optimised for a luxe dark experience
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm transition-colors hover:border-gold/40"
            >
              {settings.theme === "dark" ? (
                <>
                  <Moon className="size-4 text-gold-300" /> Dark
                </>
              ) : (
                <>
                  <Sun className="size-4 text-gold-300" /> Light
                </>
              )}
            </button>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-4">
            <div>
              <p className="text-sm font-medium">Time zone</p>
              <p className="text-xs text-muted-foreground">
                Show all times in Thailand (+07:00) or India (+05:30)
              </p>
            </div>
            <TimeZoneToggle showIcon />
          </div>
        </Card>
      </FadeIn>

      {/* Currency */}
      <FadeIn delay={0.05} className="mb-4">
        <Card className="p-5">
          <h2 className="mb-3 flex items-center gap-2 font-serif text-base font-semibold">
            <Coins className="size-4 text-gold-400" /> Exchange Rate
          </h2>
          <Label>1 THB → INR</Label>
          <div className="mt-2 flex gap-2">
            <Input
              type="number"
              step="0.01"
              value={rate}
              onChange={(e) => setRateInput(e.target.value)}
              className="flex-1"
            />
            <Button onClick={applyRate}>Save</Button>
          </div>
        </Card>
      </FadeIn>

      {/* Backup & restore */}
      <FadeIn delay={0.1} className="mb-4">
        <Card className="p-5">
          <h2 className="mb-1 font-serif text-base font-semibold">
            Data Management
          </h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Everything is stored locally on this device.
            {settings.lastBackup && (
              <>
                {" "}
                Last backup:{" "}
                {new Date(settings.lastBackup).toLocaleString("en-US")}
              </>
            )}
          </p>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button variant="secondary" onClick={handleExport}>
              <Download className="size-4" /> Export Data (JSON)
            </Button>
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>
              <Upload className="size-4" /> Import Data (JSON)
            </Button>
            <Button variant="secondary" onClick={handleCopy}>
              <ClipboardCopy className="size-4" /> Copy Backup JSON
            </Button>
            <Button
              variant="destructive"
              onClick={() => setConfirmReset(true)}
            >
              <RotateCcw className="size-4" /> Reset Trip
            </Button>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleImportFile}
          />

          <div className="mt-4 space-y-2">
            <Label>Restore from JSON</Label>
            <Textarea
              value={restoreText}
              onChange={(e) => setRestoreText(e.target.value)}
              placeholder="Paste a backup JSON here…"
              className="min-h-[100px] font-mono text-xs"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleRestore}
              disabled={!restoreText.trim()}
            >
              <ClipboardPaste className="size-4" /> Restore Data
            </Button>
          </div>
        </Card>
      </FadeIn>

      <FadeIn delay={0.15}>
        <Card className="p-5 text-center">
          <p className="text-sm text-muted-foreground">
            Thailand Luxury Escape 2026 ·{" "}
            {trip.travelers.map((t) => t.name).join(" & ")}
          </p>
          <Badge variant="muted" className="mt-2">
            v1.0.0 · PWA ready
          </Badge>
        </Card>
      </FadeIn>

      {/* Reset confirm */}
      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset entire trip?"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl bg-red-500/10 p-3">
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-red-400" />
            <p className="text-sm text-muted-foreground">
              This restores all seed data and clears your expenses, journal,
              shopping spend, packing progress and completed activities. This
              cannot be undone.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setConfirmReset(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => {
                resetTrip();
                setConfirmReset(false);
                flash("Trip reset to defaults");
              }}
            >
              Reset Trip
            </Button>
          </div>
        </div>
      </Modal>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 z-[120] -translate-x-1/2 lg:bottom-8">
          <div className="glass-gold flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-glow">
            <Check className="size-4 text-emerald-400" />
            {toast}
          </div>
        </div>
      )}
    </>
  );
}
