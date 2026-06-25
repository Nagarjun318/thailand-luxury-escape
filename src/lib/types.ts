export type ActivityStatus = "completed" | "current" | "upcoming";

export type TransportMode =
  | "walk"
  | "car"
  | "taxi"
  | "tuktuk"
  | "boat"
  | "flight"
  | "bus"
  | "ferry"
  | "metro";

export type ExpenseCategory =
  | "Food"
  | "Transport"
  | "Shopping"
  | "Attractions"
  | "Misc"
  | "Emergency";

export type ShoppingPriority = "High" | "Medium" | "Low";

export type TicketCategory = "Flights" | "Bus Tickets" | "Attractions";

export type TicketStatus = "Confirmed" | "Pending" | "Used" | "Cancelled";

export interface Activity {
  id: string;
  day: number;
  title: string;
  location: string;
  startTime: string; // ISO datetime
  endTime: string; // ISO datetime
  transport: TransportMode;
  cost: number; // in THB
  notes?: string;
  completed: boolean;
  emoji?: string;
}

export interface Expense {
  id: string;
  title: string;
  category: ExpenseCategory;
  amountTHB: number;
  day: number; // 1-5
  date: string; // ISO datetime
  notes?: string;
}

export interface Hotel {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  checkIn: string; // ISO datetime
  checkOut: string; // ISO datetime
  mapsUrl: string;
  notes?: string;
  image?: string;
}

export interface Flight {
  id: string;
  type: "Outbound" | "Return";
  airline: string;
  flightNumber: string;
  from: string;
  to: string;
  fromCode: string;
  toCode: string;
  departure: string; // ISO datetime
  arrival: string; // ISO datetime
  terminal: string;
  seat: string;
  status: TicketStatus;
  bookingNumber: string;
}

export interface BusTicket {
  id: string;
  route: string;
  from: string;
  to: string;
  bookingNumber: string;
  departure: string; // ISO datetime
  arrival: string; // ISO datetime
  durationMins: number;
  seat: string;
  status: TicketStatus;
  boardingInstructions: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  priority: ShoppingPriority;
  budgetTHB: number;
  actualTHB: number;
  purchased: boolean;
  notes?: string;
}

export interface JournalEntry {
  id: string;
  date: string; // ISO datetime
  title: string;
  content: string;
  mood?: string;
  photos: string[]; // data URLs stored locally
  linkedExpense?: number;
}

export interface PackingItem {
  id: string;
  category:
    | "Documents"
    | "Electronics"
    | "Clothes"
    | "Toiletries"
    | "Medicines"
    | "Accessories";
  name: string;
  packed: boolean;
  quantity?: number;
}

export interface TicketCode {
  imageUrl: string; // cropped code image (Storage URL or data URL)
  text?: string; // decoded payload, when detectable
  format?: string; // symbology, e.g. "QR" / "PDF417" / "Barcode"
  page?: number; // 1-based PDF page it came from
}

export interface Ticket {
  id: string;
  category: TicketCategory;
  title: string;
  bookingNumber: string;
  passenger: string;
  date: string; // ISO datetime
  seat?: string;
  status: TicketStatus;
  qrData: string;
  notes?: string;
  imageDataUrl?: string;
  pdfUrl?: string; // uploaded ticket PDF (Supabase Storage URL)
  qrImageUrl?: string; // QR cropped from the PDF (Storage URL or data URL)
  qrText?: string; // decoded QR payload, when detectable
  codes?: TicketCode[]; // every code scanned from the PDF (multi-ticket support)
}

export interface EmergencyContact {
  id: string;
  label: string;
  name: string;
  phone: string;
  category: "Police" | "Emergency" | "Embassy" | "Hotel" | "Family";
}

export interface Traveler {
  name: string;
  role?: string;
}

export interface Trip {
  name: string;
  subtitle: string;
  travelers: Traveler[];
  startDate: string; // ISO date
  endDate: string; // ISO date
  destinations: string[];
  budgetCashINR: number;
  budgetTHB: number;
}

export interface Settings {
  thbToInr: number;
  theme: "dark" | "light";
  timeZone?: "ICT" | "IST";
  lastBackup?: string;
}
