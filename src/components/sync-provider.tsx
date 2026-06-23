"use client";

import { useEffect, useState, useCallback } from "react";
import { Cloud, CloudOff, RefreshCw, AlertTriangle, Check } from "lucide-react";
import { useTripStore } from "@/lib/store";
import { initSync, onSyncStatus, pullAll, type SyncStatus } from "@/lib/sync";
import { isSupabaseConfigured } from "@/lib/supabase";

const STATUS_META: Record<
  SyncStatus,
  { label: string; icon: typeof Cloud; className: string }
> = {
  disabled: { label: "Offline mode", icon: CloudOff, className: "text-white/40" },
  idle: { label: "Synced", icon: Check, className: "text-emerald-400" },
  syncing: { label: "Syncing…", icon: RefreshCw, className: "text-gold" },
  offline: { label: "Offline", icon: CloudOff, className: "text-amber-400" },
  error: { label: "Sync error", icon: AlertTriangle, className: "text-rose-400" },
};

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SyncStatus>(
    isSupabaseConfigured ? "syncing" : "disabled"
  );
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const off = onSyncStatus(setStatus);
    const cleanup = initSync({
      getSnapshot: () => useTripStore.getState().snapshot(),
      hydrate: (data) => useTripStore.getState().hydrateFromServer(data),
    });
    return () => {
      off();
      cleanup();
    };
  }, []);

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    const data = await pullAll();
    if (data) useTripStore.getState().hydrateFromServer(data);
    setRefreshing(false);
  }, [refreshing]);

  const meta = STATUS_META[status];
  const Icon = meta.icon;

  return (
    <>
      {children}
      <div className="pointer-events-auto fixed bottom-20 right-3 z-40 flex items-center gap-1.5 md:bottom-4">
        <button
          onClick={handleRefresh}
          disabled={refreshing || status === "disabled"}
          title="Refresh data"
          className="glass flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-gold-300 disabled:opacity-40"
        >
          <RefreshCw
            className={`size-3.5 ${refreshing ? "animate-spin" : ""}`}
          />
        </button>
        <div
          className={`glass flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${meta.className}`}
          title={meta.label}
        >
          <Icon
            className={`h-3 w-3 ${status === "syncing" ? "animate-spin" : ""}`}
          />
          <span className="hidden sm:inline">{meta.label}</span>
        </div>
      </div>
    </>
  );
}
