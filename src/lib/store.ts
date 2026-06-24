"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
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
import {
  buses as seedBuses,
  defaultSettings,
  emergencyContacts as seedEmergency,
  flights as seedFlights,
  hotels as seedHotels,
  seedActivities,
  seedExpenses,
  seedJournal,
  seedPacking,
  seedShopping,
  seedTickets,
} from "./seed";
import { uid } from "./utils";
import {
  enqueueDelete,
  enqueueSettings,
  enqueueUpsert,
  pushAll,
  type SyncSnapshot,
} from "./sync";

interface TripState {
  hydrated: boolean;
  setHydrated: (v: boolean) => void;

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

  /* Sync */
  snapshot: () => SyncSnapshot;
  hydrateFromServer: (data: Partial<SyncSnapshot>) => void;

  /* Activities */
  toggleActivity: (id: string) => void;

  /* Expenses */
  addExpense: (e: Omit<Expense, "id">) => void;
  updateExpense: (id: string, patch: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  /* Shopping */
  addShopping: (s: Omit<ShoppingItem, "id">) => void;
  updateShopping: (id: string, patch: Partial<ShoppingItem>) => void;
  deleteShopping: (id: string) => void;
  toggleShopping: (id: string) => void;

  /* Packing */
  togglePacking: (id: string) => void;
  addPacking: (p: Omit<PackingItem, "id">) => void;
  deletePacking: (id: string) => void;

  /* Journal */
  addJournal: (j: Omit<JournalEntry, "id">) => void;
  updateJournal: (id: string, patch: Partial<JournalEntry>) => void;
  deleteJournal: (id: string) => void;

  /* Tickets */
  updateTicket: (id: string, patch: Partial<Ticket>) => void;

  /* Settings */
  setRate: (rate: number) => void;
  updateSettings: (patch: Partial<Settings>) => void;

  /* Data management */
  exportData: () => string;
  importData: (json: string) => boolean;
  resetTrip: () => void;
}

const initialData = {
  activities: seedActivities,
  expenses: seedExpenses,
  shopping: seedShopping,
  packing: seedPacking,
  journal: seedJournal,
  tickets: seedTickets,
  hotels: seedHotels,
  flights: seedFlights,
  buses: seedBuses,
  emergency: seedEmergency,
  settings: defaultSettings,
};

export const useTripStore = create<TripState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      setHydrated: (v) => set({ hydrated: v }),

      ...initialData,

      snapshot: () => {
        const s = get();
        return {
          activities: s.activities,
          expenses: s.expenses,
          shopping: s.shopping,
          packing: s.packing,
          journal: s.journal,
          tickets: s.tickets,
          hotels: s.hotels,
          flights: s.flights,
          buses: s.buses,
          emergency: s.emergency,
          settings: s.settings,
        };
      },

      hydrateFromServer: (data) => {
        // Use seed activities as source of truth, only preserve completed status
        const serverActivities = data.activities ?? [];
        const completedSet = new Set(
          serverActivities.filter((a) => a.completed).map((a) => `${a.day}:${a.title}`)
        );
        const activities = seedActivities.map((a) => ({
          ...a,
          completed: completedSet.has(`${a.day}:${a.title}`),
        }));
        set((s) => ({
          activities,
          expenses: data.expenses ?? s.expenses,
          shopping: data.shopping ?? s.shopping,
          packing: data.packing ?? s.packing,
          journal: data.journal ?? s.journal,
          tickets: data.tickets ?? s.tickets,
          hotels: data.hotels?.length ? data.hotels : s.hotels,
          flights: data.flights?.length ? data.flights : s.flights,
          buses: data.buses?.length ? data.buses : s.buses,
          emergency: data.emergency?.length ? data.emergency : s.emergency,
          settings: data.settings ?? s.settings,
        }));
      },

      toggleActivity: (id) => {
        set((s) => ({
          activities: s.activities.map((a) =>
            a.id === id ? { ...a, completed: !a.completed } : a
          ),
        }));
        const a = get().activities.find((x) => x.id === id);
        if (a) enqueueUpsert("activities", a);
      },

      addExpense: (e) => {
        const item: Expense = { ...e, id: uid("exp") };
        set((s) => ({ expenses: [item, ...s.expenses] }));
        enqueueUpsert("expenses", item);
      },
      updateExpense: (id, patch) => {
        set((s) => ({
          expenses: s.expenses.map((e) =>
            e.id === id ? { ...e, ...patch } : e
          ),
        }));
        const e = get().expenses.find((x) => x.id === id);
        if (e) enqueueUpsert("expenses", e);
      },
      deleteExpense: (id) => {
        set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) }));
        enqueueDelete("expenses", id);
      },

      addShopping: (item) => {
        const s: ShoppingItem = { ...item, id: uid("shop") };
        set((st) => ({ shopping: [...st.shopping, s] }));
        enqueueUpsert("shopping", s);
      },
      updateShopping: (id, patch) => {
        set((s) => ({
          shopping: s.shopping.map((i) =>
            i.id === id ? { ...i, ...patch } : i
          ),
        }));
        const i = get().shopping.find((x) => x.id === id);
        if (i) enqueueUpsert("shopping", i);
      },
      deleteShopping: (id) => {
        set((s) => ({ shopping: s.shopping.filter((i) => i.id !== id) }));
        enqueueDelete("shopping", id);
      },
      toggleShopping: (id) => {
        set((s) => ({
          shopping: s.shopping.map((i) =>
            i.id === id ? { ...i, purchased: !i.purchased } : i
          ),
        }));
        const i = get().shopping.find((x) => x.id === id);
        if (i) enqueueUpsert("shopping", i);
      },

      togglePacking: (id) => {
        set((s) => ({
          packing: s.packing.map((p) =>
            p.id === id ? { ...p, packed: !p.packed } : p
          ),
        }));
        const p = get().packing.find((x) => x.id === id);
        if (p) enqueueUpsert("packing", p);
      },
      addPacking: (p) => {
        const item: PackingItem = { ...p, id: uid("pk") };
        set((s) => ({ packing: [...s.packing, item] }));
        enqueueUpsert("packing", item);
      },
      deletePacking: (id) => {
        set((s) => ({ packing: s.packing.filter((p) => p.id !== id) }));
        enqueueDelete("packing", id);
      },

      addJournal: (j) => {
        const item: JournalEntry = { ...j, id: uid("jrn") };
        set((s) => ({ journal: [item, ...s.journal] }));
        enqueueUpsert("journal", item);
      },
      updateJournal: (id, patch) => {
        set((s) => ({
          journal: s.journal.map((j) =>
            j.id === id ? { ...j, ...patch } : j
          ),
        }));
        const j = get().journal.find((x) => x.id === id);
        if (j) enqueueUpsert("journal", j);
      },
      deleteJournal: (id) => {
        set((s) => ({ journal: s.journal.filter((j) => j.id !== id) }));
        enqueueDelete("journal", id);
      },

      updateTicket: (id, patch) => {
        set((s) => ({
          tickets: s.tickets.map((t) =>
            t.id === id ? { ...t, ...patch } : t
          ),
        }));
        const t = get().tickets.find((x) => x.id === id);
        if (t) enqueueUpsert("tickets", t);
      },

      setRate: (rate) => {
        set((s) => ({ settings: { ...s.settings, thbToInr: rate } }));
        enqueueSettings(get().settings);
      },
      updateSettings: (patch) => {
        set((s) => ({ settings: { ...s.settings, ...patch } }));
        enqueueSettings(get().settings);
      },

      exportData: () => {
        const s = get();
        return JSON.stringify(
          {
            version: 2,
            exportedAt: new Date().toISOString(),
            activities: s.activities,
            expenses: s.expenses,
            shopping: s.shopping,
            packing: s.packing,
            journal: s.journal,
            tickets: s.tickets,
            hotels: s.hotels,
            flights: s.flights,
            buses: s.buses,
            emergency: s.emergency,
            settings: s.settings,
          },
          null,
          2
        );
      },

      importData: (json) => {
        try {
          const data = JSON.parse(json);
          set((s) => ({
            activities: data.activities ?? s.activities,
            expenses: data.expenses ?? s.expenses,
            shopping: data.shopping ?? s.shopping,
            packing: data.packing ?? s.packing,
            journal: data.journal ?? s.journal,
            tickets: data.tickets ?? s.tickets,
            hotels: data.hotels ?? s.hotels,
            flights: data.flights ?? s.flights,
            buses: data.buses ?? s.buses,
            emergency: data.emergency ?? s.emergency,
            settings: { ...s.settings, ...(data.settings ?? {}) },
          }));
          pushAll(get().snapshot());
          return true;
        } catch {
          return false;
        }
      },

      resetTrip: () => {
        set({
          activities: seedActivities.map((a) => ({ ...a, completed: false })),
          expenses: seedExpenses,
          shopping: seedShopping.map((s) => ({
            ...s,
            actualTHB: 0,
            purchased: false,
          })),
          packing: seedPacking.map((p) => ({ ...p, packed: false })),
          journal: seedJournal,
          tickets: seedTickets,
          hotels: seedHotels,
          flights: seedFlights,
          buses: seedBuses,
          emergency: seedEmergency,
          settings: defaultSettings,
        });
        pushAll(get().snapshot());
      },
    }),
    {
      name: "thailand-luxury-escape-v3",
      partialize: (s) => ({
        activities: s.activities,
        expenses: s.expenses,
        shopping: s.shopping,
        packing: s.packing,
        journal: s.journal,
        tickets: s.tickets,
        hotels: s.hotels,
        flights: s.flights,
        buses: s.buses,
        emergency: s.emergency,
        settings: s.settings,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Use seed activities, preserve completed status by day+title
          const completedSet = new Set(
            state.activities.filter((a) => a.completed).map((a) => `${a.day}:${a.title}`)
          );
          state.activities = seedActivities.map((a) => ({
            ...a,
            completed: completedSet.has(`${a.day}:${a.title}`),
          }));
        }
        state?.setHydrated(true);
      },
    }
  )
);
