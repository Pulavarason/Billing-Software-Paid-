import { LayoutDashboard, FilePlus2, Package, Receipt, Settings, CircleDollarSign } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/bills/create", label: "Create Bill", icon: FilePlus2 },
  { href: "/due-bills/create", label: "Create Due Bill", icon: CircleDollarSign },
  { href: "/products", label: "Products", icon: Package },
  { href: "/bills", label: "Bills", icon: Receipt },
  { href: "/dues", label: "Dues", icon: CircleDollarSign },
  { href: "/settings", label: "Settings", icon: Settings }
];
