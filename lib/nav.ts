import { LayoutDashboard, FilePlus2, Package, Receipt, Settings, CreditCard } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/bills/create", label: "Create Bill", icon: FilePlus2 },
  { href: "/products", label: "Products", icon: Package },
  { href: "/bills", label: "Bills", icon: Receipt },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings }
];
