export type ProductStatus = "active" | "inactive";

export interface Variant {
  id: string;
  size: string; // e.g. "250 g", "1 kg"
  price: number;
  sku?: string;
}

export interface Product {
  id: string;
  name: string;
  category?: string;
  description?: string;
  status: ProductStatus;
  variants: Variant[];
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface BillItem {
  productId: string;
  productName: string; // snapshot
  variantId: string;
  variantSize: string; // snapshot
  sku?: string; // snapshot
  price: number; // snapshot - price at time of sale
  quantity: number;
  amount: number; // price * quantity
}

export interface Bill {
  id: string;
  billNumber: string; // e.g. SKM-000001
  date: string; // ISO date (yyyy-mm-dd)
  time: string; // HH:mm
  createdAt: string; // full ISO timestamp
  customerName?: string;
  customerPhone?: string;
  items: BillItem[];
  subtotal: number;
  discount: number;
  grandTotal: number;
}

export interface BusinessSettings {
  businessName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  gstNumber?: string;
  invoiceFooter: string;
}

export interface AppPreferences {
  theme: "light" | "dark";
}

export interface AppData {
  version: number;
  products: Product[];
  bills: Bill[];
  settings: BusinessSettings;
  billCounter: number;
}

export interface BackupFile {
  exportedAt: string;
  appVersion: number;
  data: AppData;
}
