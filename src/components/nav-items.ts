import {
  LayoutDashboard,
  CalendarRange,
  Ticket,
  Wallet,
  ShoppingBag,
  ArrowLeftRight,
  BedDouble,
  Plane,
  Bus,
  NotebookPen,
  Luggage,
  LifeBuoy,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  short: string;
  icon: LucideIcon;
  group: "primary" | "travel" | "tools";
}

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", short: "Home", icon: LayoutDashboard, group: "primary" },
  { href: "/itinerary", label: "Itinerary", short: "Plan", icon: CalendarRange, group: "primary" },
  { href: "/tickets", label: "Ticket Center", short: "Tickets", icon: Ticket, group: "primary" },
  { href: "/budget", label: "Budget", short: "Budget", icon: Wallet, group: "primary" },
  { href: "/shopping", label: "Shopping", short: "Shop", icon: ShoppingBag, group: "tools" },
  { href: "/currency", label: "Currency", short: "Convert", icon: ArrowLeftRight, group: "tools" },
  { href: "/hotels", label: "Hotels", short: "Hotels", icon: BedDouble, group: "travel" },
  { href: "/flights", label: "Flights", short: "Flights", icon: Plane, group: "travel" },
  { href: "/bus", label: "Bus Transfers", short: "Bus", icon: Bus, group: "travel" },
  { href: "/journal", label: "Travel Journal", short: "Journal", icon: NotebookPen, group: "tools" },
  { href: "/packing", label: "Packing", short: "Packing", icon: Luggage, group: "tools" },
  { href: "/emergency", label: "Emergency", short: "SOS", icon: LifeBuoy, group: "tools" },
  { href: "/analytics", label: "Analytics", short: "Stats", icon: BarChart3, group: "tools" },
  { href: "/settings", label: "Settings", short: "Settings", icon: Settings, group: "tools" },
];

/** Items surfaced in the mobile bottom navigation bar (max 4). */
export const bottomNavItems: NavItem[] = [
  navItems[0], // Dashboard
  navItems[1], // Itinerary
  navItems[2], // Tickets
  navItems[3], // Budget
];

/** Items shown in the mobile "More" drawer. */
export const moreNavItems: NavItem[] = navItems.filter(
  (item) => !bottomNavItems.includes(item)
);
