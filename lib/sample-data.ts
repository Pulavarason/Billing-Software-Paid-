import { AppData, Bill, BillItem, Product, Variant } from "./types";
import { generateId } from "./id";
import { formatBillNumber, todayIso } from "./format";

function v(size: string, price: number, sku: string): Variant {
  return { id: generateId("var"), size, price, sku };
}

function stdVariants(code: string, base: number): Variant[] {
  return [
    v("100 g", base, `SKU-${code}100`),
    v("250 g", Math.round(base * 2.55), `SKU-${code}250`),
    v("500 g", Math.round(base * 4.4), `SKU-${code}500`),
    v("1 kg", Math.round(base * 8), `SKU-${code}1KG`)
  ];
}

const now = () => new Date().toISOString();

export function buildSampleProducts(): Product[] {
  const specs: Array<[string, string, number]> = [
    ["Chilli Powder", "CP", 35],
    ["Turmeric Powder", "TP", 30],
    ["Coriander Powder", "CRP", 28],
    ["Garam Masala", "GM", 45],
    ["Chicken Masala", "CHM", 48],
    ["Mutton Masala", "MTM", 50],
    ["Sambar Powder", "SP", 32],
    ["Rasam Powder", "RP", 30],
    ["Biryani Masala", "BM", 55],
    ["Pepper Powder", "PP", 60],
    ["Cumin Powder", "CMP", 42],
    ["Coriander Cumin Powder", "CCP", 34],
    ["Ginger Powder", "GP", 50],
    ["Garlic Powder", "GLP", 48],
    ["Chat Masala", "CTM", 38],
    ["Kitchen King Masala", "KKM", 46],
    ["Fish Curry Masala", "FCM", 44],
    ["Meat Masala", "MM", 48],
    ["Tandoori Masala", "TM", 40],
    ["Garam Masala Special", "GMS", 58]
  ];

  return specs.map(([name, code, base]) => ({
    id: generateId("prod"),
    name,
    category: "Masala Powders",
    description: "",
    status: "active",
    variants: stdVariants(code, base),
    createdAt: now(),
    updatedAt: now()
  }));
}

function makeItem(product: Product, sizeIndex: number, qty: number): BillItem {
  const variant = product.variants[sizeIndex];
  return {
    productId: product.id,
    productName: product.name,
    variantId: variant.id,
    variantSize: variant.size,
    sku: variant.sku,
    price: variant.price,
    quantity: qty,
    amount: variant.price * qty
  };
}

export function buildSampleBills(products: Product[]): { bills: Bill[]; nextCounter: number } {
  const findByName = (name: string) => products.find((p) => p.name === name)!;

  const chilli = findByName("Chilli Powder");
  const turmeric = findByName("Turmeric Powder");
  const coriander = findByName("Coriander Powder");
  const garam = findByName("Garam Masala");
  const biryani = findByName("Biryani Masala");
  const sambar = findByName("Sambar Powder");

  const today = todayIso();

  const sampleDefs: Array<{ items: BillItem[]; discount: number; customer?: string }> = [
    { items: [makeItem(chilli, 2, 2), makeItem(turmeric, 2, 1), makeItem(coriander, 3, 2)], discount: 0, customer: "Ramesh" },
    { items: [makeItem(garam, 1, 3), makeItem(sambar, 1, 2)], discount: 20, customer: "Kumar" },
    { items: [makeItem(biryani, 2, 1), makeItem(chilli, 1, 4)], discount: 0, customer: "Lakshmi" },
    { items: [makeItem(turmeric, 3, 1), makeItem(coriander, 2, 2), makeItem(garam, 2, 1)], discount: 50 }
  ];

  const bills: Bill[] = sampleDefs.map((def, idx) => {
    const subtotal = def.items.reduce((sum, it) => sum + it.amount, 0);
    const grandTotal = Math.max(0, subtotal - def.discount);
    const counter = idx + 1;
    return {
      id: generateId("bill"),
      billNumber: formatBillNumber(counter),
      date: today,
      time: `${9 + idx}:${idx % 2 === 0 ? "15" : "40"}`,
      createdAt: now(),
      customerName: def.customer,
      items: def.items,
      subtotal,
      discount: def.discount,
      deliveryCharge: 0,
      grandTotal,
      paidAmount: grandTotal,
      dueAmount: 0
    };
  });

  return { bills, nextCounter: sampleDefs.length + 1 };
}

export function buildInitialData(): AppData {
  const products = buildSampleProducts();
  const { bills, nextCounter } = buildSampleBills(products);

  return {
    version: 1,
    products,
    bills,
    billCounter: nextCounter,
    settings: {
      businessName: "Demo Business",
      tagline: "Manufacturers & Dealers in Masala Products",
      address: "No. 25, Main Road,\nChennai - 6000XX,\nTamil Nadu, India",
      phone: "+91 98765 43210",
      email: "info@skandhasmasala.com",
      gstNumber: "",
      invoiceFooter: "Thank you for your business!"
    }
  };
}
