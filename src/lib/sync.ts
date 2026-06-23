"use client";

import {
  getSupabase,
  isSupabaseConfigured,
  TRIP_ID,
  MEDIA_BUCKET,
} from "./supabase";
import { trip as seedTrip } from "./seed";
import type {
  Activity,
  BusTicket,
  EmergencyContact,
  Expense,
  Flight,
  Hotel,
  JournalEntry,
  PackingItem,
  Settings,
  ShoppingItem,
  Ticket,
} from "./types";

/* -------------------------------------------------------------------------- */
/*  Collection descriptors (app <-> database row mapping)                      */
/* -------------------------------------------------------------------------- */

export type CollectionKey =
  | "activities"
  | "expenses"
  | "shopping"
  | "packing"
  | "journal"
  | "tickets"
  | "hotels"
  | "flights"
  | "buses"
  | "emergency";

interface Descriptor<T extends { id: string }> {
  table: string;
  toRow: (item: T) => Record<string, unknown>;
  fromRow: (row: Record<string, any>) => T;
}

const withTrip = (row: Record<string, unknown>) => ({
  ...row,
  trip_id: TRIP_ID,
  updated_at: new Date().toISOString(),
});

const num = (v: unknown) => (v == null ? 0 : Number(v));

export const DESCRIPTORS: { [K in CollectionKey]: Descriptor<any> } = {
  activities: {
    table: "activities",
    toRow: (a: Activity) =>
      withTrip({
        id: a.id,
        day: a.day,
        title: a.title,
        location: a.location,
        start_time: a.startTime,
        end_time: a.endTime,
        transport: a.transport,
        cost: a.cost,
        notes: a.notes ?? null,
        completed: a.completed,
        emoji: a.emoji ?? null,
      }),
    fromRow: (r): Activity => ({
      id: r.id,
      day: r.day,
      title: r.title,
      location: r.location,
      startTime: r.start_time,
      endTime: r.end_time,
      transport: r.transport,
      cost: num(r.cost),
      notes: r.notes ?? undefined,
      completed: !!r.completed,
      emoji: r.emoji ?? undefined,
    }),
  },
  expenses: {
    table: "expenses",
    toRow: (e: Expense) =>
      withTrip({
        id: e.id,
        title: e.title,
        category: e.category,
        amount_thb: e.amountTHB,
        date: e.date,
        notes: e.notes ?? null,
      }),
    fromRow: (r): Expense => ({
      id: r.id,
      title: r.title,
      category: r.category,
      amountTHB: num(r.amount_thb),
      date: r.date,
      notes: r.notes ?? undefined,
    }),
  },
  shopping: {
    table: "shopping_items",
    toRow: (s: ShoppingItem) =>
      withTrip({
        id: s.id,
        name: s.name,
        priority: s.priority,
        budget_thb: s.budgetTHB,
        actual_thb: s.actualTHB,
        purchased: s.purchased,
        notes: s.notes ?? null,
      }),
    fromRow: (r): ShoppingItem => ({
      id: r.id,
      name: r.name,
      priority: r.priority,
      budgetTHB: num(r.budget_thb),
      actualTHB: num(r.actual_thb),
      purchased: !!r.purchased,
      notes: r.notes ?? undefined,
    }),
  },
  packing: {
    table: "packing_items",
    toRow: (p: PackingItem) =>
      withTrip({
        id: p.id,
        category: p.category,
        name: p.name,
        packed: p.packed,
        quantity: p.quantity ?? null,
      }),
    fromRow: (r): PackingItem => ({
      id: r.id,
      category: r.category,
      name: r.name,
      packed: !!r.packed,
      quantity: r.quantity ?? undefined,
    }),
  },
  journal: {
    table: "journal_entries",
    toRow: (j: JournalEntry) =>
      withTrip({
        id: j.id,
        date: j.date,
        title: j.title,
        content: j.content,
        mood: j.mood ?? null,
        photos: j.photos ?? [],
      }),
    fromRow: (r): JournalEntry => ({
      id: r.id,
      date: r.date,
      title: r.title,
      content: r.content,
      mood: r.mood ?? undefined,
      photos: Array.isArray(r.photos) ? r.photos : [],
    }),
  },
  tickets: {
    table: "tickets",
    toRow: (t: Ticket) =>
      withTrip({
        id: t.id,
        category: t.category,
        title: t.title,
        booking_number: t.bookingNumber,
        passenger: t.passenger,
        date: t.date,
        seat: t.seat ?? null,
        status: t.status,
        qr_data: t.qrData,
        notes: t.notes ?? null,
        image_url: t.imageDataUrl ?? null,
        pdf_url: t.pdfUrl ?? null,
        qr_image_url: t.qrImageUrl ?? null,
        qr_text: t.qrText ?? null,
        codes: t.codes ?? null,
      }),
    fromRow: (r): Ticket => ({
      id: r.id,
      category: r.category,
      title: r.title,
      bookingNumber: r.booking_number,
      passenger: r.passenger,
      date: r.date,
      seat: r.seat ?? undefined,
      status: r.status,
      qrData: r.qr_data,
      notes: r.notes ?? undefined,
      imageDataUrl: r.image_url ?? undefined,
      pdfUrl: r.pdf_url ?? undefined,
      qrImageUrl: r.qr_image_url ?? undefined,
      qrText: r.qr_text ?? undefined,
      codes: r.codes ?? undefined,
    }),
  },
  hotels: {
    table: "hotels",
    toRow: (h: Hotel) =>
      withTrip({
        id: h.id,
        name: h.name,
        city: h.city,
        address: h.address,
        phone: h.phone,
        check_in: h.checkIn,
        check_out: h.checkOut,
        maps_url: h.mapsUrl,
        notes: h.notes ?? null,
        image: h.image ?? null,
      }),
    fromRow: (r): Hotel => ({
      id: r.id,
      name: r.name,
      city: r.city,
      address: r.address,
      phone: r.phone,
      checkIn: r.check_in,
      checkOut: r.check_out,
      mapsUrl: r.maps_url,
      notes: r.notes ?? undefined,
      image: r.image ?? undefined,
    }),
  },
  flights: {
    table: "flights",
    toRow: (f: Flight) =>
      withTrip({
        id: f.id,
        type: f.type,
        airline: f.airline,
        flight_number: f.flightNumber,
        from_city: f.from,
        to_city: f.to,
        from_code: f.fromCode,
        to_code: f.toCode,
        departure: f.departure,
        arrival: f.arrival,
        terminal: f.terminal,
        seat: f.seat,
        status: f.status,
        booking_number: f.bookingNumber,
      }),
    fromRow: (r): Flight => ({
      id: r.id,
      type: r.type,
      airline: r.airline,
      flightNumber: r.flight_number,
      from: r.from_city,
      to: r.to_city,
      fromCode: r.from_code,
      toCode: r.to_code,
      departure: r.departure,
      arrival: r.arrival,
      terminal: r.terminal,
      seat: r.seat,
      status: r.status,
      bookingNumber: r.booking_number,
    }),
  },
  buses: {
    table: "bus_tickets",
    toRow: (b: BusTicket) =>
      withTrip({
        id: b.id,
        route: b.route,
        from_loc: b.from,
        to_loc: b.to,
        booking_number: b.bookingNumber,
        departure: b.departure,
        arrival: b.arrival,
        duration_mins: b.durationMins,
        seat: b.seat,
        status: b.status,
        boarding_instructions: b.boardingInstructions,
      }),
    fromRow: (r): BusTicket => ({
      id: r.id,
      route: r.route,
      from: r.from_loc,
      to: r.to_loc,
      bookingNumber: r.booking_number,
      departure: r.departure,
      arrival: r.arrival,
      durationMins: num(r.duration_mins),
      seat: r.seat,
      status: r.status,
      boardingInstructions: r.boarding_instructions,
    }),
  },
  emergency: {
    table: "emergency_contacts",
    toRow: (c: EmergencyContact) =>
      withTrip({
        id: c.id,
        label: c.label,
        name: c.name,
        phone: c.phone,
        category: c.category,
      }),
    fromRow: (r): EmergencyContact => ({
      id: r.id,
      label: r.label,
      name: r.name,
      phone: r.phone,
      category: r.category,
    }),
  },
};

const ALL_KEYS = Object.keys(DESCRIPTORS) as CollectionKey[];

/* -------------------------------------------------------------------------- */
/*  Snapshot shape exchanged with the store                                   */
/* -------------------------------------------------------------------------- */

export interface SyncSnapshot {
  activities: Activity[];
  expenses: Expense[];
  shopping: ShoppingItem[];
  packing: PackingItem[];
  journal: JournalEntry[];
  tickets: Ticket[];
  hotels: Hotel[];
  flights: Flight[];
  buses: BusTicket[];
  emergency: EmergencyContact[];
  settings: Settings;
}

/* -------------------------------------------------------------------------- */
/*  Offline outbox queue                                                       */
/* -------------------------------------------------------------------------- */

type Op =
  | { kind: "upsert"; collection: CollectionKey; item: { id: string } }
  | { kind: "delete"; collection: CollectionKey; id: string }
  | { kind: "settings"; settings: Settings };

const OUTBOX_KEY = "tle-sync-outbox";
let outbox: Op[] = [];
let flushing = false;
let loaded = false;
let _schedulePull: (() => void) | null = null;

type StatusListener = (s: SyncStatus) => void;
export type SyncStatus = "idle" | "syncing" | "offline" | "disabled" | "error";
let status: SyncStatus = isSupabaseConfigured ? "idle" : "disabled";
const statusListeners = new Set<StatusListener>();

function setStatus(s: SyncStatus) {
  status = s;
  statusListeners.forEach((l) => l(s));
}

export function getSyncStatus() {
  return status;
}

export function onSyncStatus(listener: StatusListener) {
  statusListeners.add(listener);
  listener(status);
  return () => statusListeners.delete(listener);
}

function loadOutbox() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    outbox = JSON.parse(localStorage.getItem(OUTBOX_KEY) || "[]");
  } catch {
    outbox = [];
  }
}

function persistOutbox() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(OUTBOX_KEY, JSON.stringify(outbox));
  } catch {
    /* ignore quota errors */
  }
}

function pushOp(op: Op) {
  loadOutbox();
  // Collapse redundant ops targeting the same row.
  if (op.kind === "upsert") {
    outbox = outbox.filter(
      (o) =>
        !(
          (o.kind === "upsert" || o.kind === "delete") &&
          o.collection === op.collection &&
          (o.kind === "upsert" ? o.item.id : o.id) === op.item.id
        )
    );
  } else if (op.kind === "delete") {
    outbox = outbox.filter(
      (o) =>
        !(
          (o.kind === "upsert" || o.kind === "delete") &&
          o.collection === op.collection &&
          (o.kind === "upsert" ? o.item.id : o.id) === op.id
        )
    );
  } else if (op.kind === "settings") {
    outbox = outbox.filter((o) => o.kind !== "settings");
  }
  outbox.push(op);
  persistOutbox();
  void flushOutbox();
}

export function enqueueUpsert(collection: CollectionKey, item: { id: string }) {
  if (!isSupabaseConfigured) return;
  pushOp({ kind: "upsert", collection, item });
}

export function enqueueDelete(collection: CollectionKey, id: string) {
  if (!isSupabaseConfigured) return;
  pushOp({ kind: "delete", collection, id });
}

export function enqueueSettings(settings: Settings) {
  if (!isSupabaseConfigured) return;
  pushOp({ kind: "settings", settings });
}

/** Enqueue upserts for the entire snapshot (used by reset / import / seeding). */
export function pushAll(snapshot: SyncSnapshot) {
  if (!isSupabaseConfigured) return;
  for (const key of ALL_KEYS) {
    for (const item of snapshot[key] as { id: string }[]) {
      pushOp({ kind: "upsert", collection: key, item });
    }
  }
  pushOp({ kind: "settings", settings: snapshot.settings });
}

async function ensureTripRow() {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from("trips").upsert({
    id: TRIP_ID,
    name: seedTrip.name,
    subtitle: seedTrip.subtitle,
    travelers: seedTrip.travelers,
    start_date: seedTrip.startDate,
    end_date: seedTrip.endDate,
    destinations: seedTrip.destinations,
    budget_cash_inr: seedTrip.budgetCashINR,
    budget_thb: seedTrip.budgetTHB,
    updated_at: new Date().toISOString(),
  });
}

export async function flushOutbox(): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  loadOutbox();
  if (flushing) return false;
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    setStatus("offline");
    return false;
  }
  if (outbox.length === 0) return true;

  flushing = true;
  setStatus("syncing");
  try {
    await ensureTripRow();
    // Process sequentially; stop on first failure to retry later.
    while (outbox.length > 0) {
      const op = outbox[0];
      if (op.kind === "settings") {
        const { error } = await supabase.from("settings").upsert({
          id: TRIP_ID,
          thb_to_inr: op.settings.thbToInr,
          theme: op.settings.theme,
          last_backup: op.settings.lastBackup ?? null,
          updated_at: new Date().toISOString(),
        });
        if (error) throw error;
      } else if (op.kind === "upsert") {
        const d = DESCRIPTORS[op.collection];
        const { error } = await supabase.from(d.table).upsert(d.toRow(op.item));
        if (error) throw error;
      } else {
        const d = DESCRIPTORS[op.collection];
        const { error } = await supabase
          .from(d.table)
          .delete()
          .eq("id", op.id);
        if (error) throw error;
      }
      outbox.shift();
      persistOutbox();
    }
    setStatus("idle");
    return true;
  } catch {
    setStatus("error");
    return false;
  } finally {
    flushing = false;
    // After flush completes, schedule a pull so any concurrent remote changes
    // (or confirmation of our own write) are picked up cleanly.
    if (typeof _schedulePull === "function") _schedulePull();
  }
}

/* -------------------------------------------------------------------------- */
/*  Pull                                                                       */
/* -------------------------------------------------------------------------- */

export async function pullAll(): Promise<Partial<SyncSnapshot> | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const result: Partial<SyncSnapshot> = {};
  for (const key of ALL_KEYS) {
    const d = DESCRIPTORS[key];
    const { data, error } = await supabase
      .from(d.table)
      .select("*")
      .eq("trip_id", TRIP_ID);
    if (error) return null;
    (result as any)[key] = (data ?? []).map((r) => d.fromRow(r));
  }

  const { data: settingsRow } = await supabase
    .from("settings")
    .select("*")
    .eq("id", TRIP_ID)
    .maybeSingle();
  if (settingsRow) {
    result.settings = {
      thbToInr: num(settingsRow.thb_to_inr) || 2.4,
      theme: (settingsRow.theme as Settings["theme"]) || "dark",
      lastBackup: settingsRow.last_backup ?? undefined,
    };
  }
  return result;
}

/** Whether the remote trip has been initialised (any activities present). */
async function isRemoteSeeded(): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { count } = await supabase
    .from("trips")
    .select("id", { count: "exact", head: true })
    .eq("id", TRIP_ID);
  return (count ?? 0) > 0;
}

/* -------------------------------------------------------------------------- */
/*  Media upload                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Uploads an image File to Supabase Storage and returns its public URL.
 * Returns null when Supabase isn't configured (caller should fall back to a
 * local data URL).
 */
export async function uploadMedia(
  file: File,
  folder = "misc"
): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${folder}/${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) return null;
  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/* -------------------------------------------------------------------------- */
/*  Init: bootstrap + realtime + connectivity                                 */
/* -------------------------------------------------------------------------- */

interface InitArgs {
  getSnapshot: () => SyncSnapshot;
  hydrate: (data: Partial<SyncSnapshot>) => void;
}

export function initSync({ getSnapshot, hydrate }: InitArgs): () => void {
  const supabase = getSupabase();
  if (!supabase) {
    setStatus("disabled");
    return () => {};
  }

  loadOutbox();
  let disposed = false;
  let pullTimer: ReturnType<typeof setTimeout> | null = null;

  const doPull = async () => {
    const data = await pullAll();
    if (!disposed && data) hydrate(data);
  };

  const schedulePull = () => {
    if (pullTimer) clearTimeout(pullTimer);
    pullTimer = setTimeout(doPull, 400);
  };

  _schedulePull = schedulePull;

  const bootstrap = async () => {
    setStatus("syncing");
    const seeded = await isRemoteSeeded();
    if (!seeded) {
      // Fresh database — migrate the current (seed/local) state up.
      pushAll(getSnapshot());
      await flushOutbox();
    } else {
      // Existing trip — push any pending local edits, then pull the truth.
      await flushOutbox();
      await doPull();
    }
    if (!disposed) setStatus(outbox.length ? "error" : "idle");
  };

  void bootstrap();

  // Realtime: any change on the trip's tables triggers a debounced re-pull.
  // Skip if we have pending outbox ops — the event is likely self-triggered by
  // our own write and pulling now would return stale data before the flush lands.
  const channel = supabase
    .channel("trip-sync")
    .on("postgres_changes", { event: "*", schema: "public" }, () => {
      if (outbox.length === 0 && !flushing) schedulePull();
    })
    .subscribe();

  const onOnline = () => void flushOutbox().then(() => doPull());
  const onOffline = () => setStatus("offline");
  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);

  return () => {
    disposed = true;
    if (pullTimer) clearTimeout(pullTimer);
    supabase.removeChannel(channel);
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
  };
}
