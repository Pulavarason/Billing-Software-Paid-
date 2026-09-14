"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Printer, RotateCcw, Save } from "lucide-react";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import ProductSelector from "@/components/ProductSelector";
import BillItemsTable from "@/components/BillItemsTable";
import InvoiceTemplate from "@/components/InvoiceTemplate";
import { Bill, BillItem } from "@/lib/types";
import { formatCurrency, formatDateDisplay, todayIso, nowTime } from "@/lib/format";
import { generateInvoicePdf } from "@/lib/pdf";

type SaveAction = "save" | "print" | "pdf";

export default function CreateBillPage() {
  const { data, isReady, addBill, nextBillNumberPreview } = useData();
  const { showToast } = useToast();
  const router = useRouter();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [items, setItems] = useState<BillItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [busy, setBusy] = useState<SaveAction | null>(null);
  const [pdfBill, setPdfBill] = useState<Bill | null>(null);
  const hiddenInvoiceRef = useRef<HTMLDivElement>(null);

  const activeProducts = useMemo(
    () => data.products.filter((p) => p.status === "active" && p.variants.length > 0),
    [data.products]
  );

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const safeDiscount = Math.min(Math.max(discount, 0), subtotal);
  const grandTotal = Math.max(0, subtotal - safeDiscount);

  const handleAddItem = (payload: {
    productId: string;
    productName: string;
    variantId: string;
    variantSize: string;
    sku?: string;
    price: number;
    quantity: number;
  }) => {
    const newItem: BillItem = {
      ...payload,
      amount: payload.price * payload.quantity
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const clearForm = () => {
    setCustomerName("");
    setCustomerPhone("");
    setItems([]);
    setDiscount(0);
  };

  const buildBillPayload = (): Omit<Bill, "id" | "billNumber" | "createdAt"> => ({
    date: todayIso(),
    time: nowTime(),
    customerName: customerName.trim() || undefined,
    customerPhone: customerPhone.trim() || undefined,
    items,
    subtotal,
    discount: safeDiscount,
    grandTotal
  });

  const handleSave = async (action: SaveAction) => {
    if (items.length === 0) {
      showToast("Add at least one item before saving the bill.", "error");
      return;
    }
    setBusy(action);
    try {
      const created = addBill(buildBillPayload());

      if (action === "save") {
        showToast(`Bill ${created.billNumber} saved successfully.`);
        clearForm();
        router.push(`/bills/${created.id}`);
        return;
      }

      if (action === "print") {
        showToast(`Bill ${created.billNumber} saved. Opening print preview...`);
        clearForm();
        window.open(`/print/${created.id}`, "_blank");
        router.push(`/bills/${created.id}`);
        return;
      }

      if (action === "pdf") {
        setPdfBill(created);
        // Wait for the hidden invoice to render before capturing it.
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        if (hiddenInvoiceRef.current) {
          await generateInvoicePdf(hiddenInvoiceRef.current, `${created.billNumber}.pdf`);
          showToast(`Bill ${created.billNumber} saved and PDF downloaded.`);
        }
        setPdfBill(null);
        clearForm();
        router.push(`/bills/${created.id}`);
      }
    } catch (err) {
      showToast("Something went wrong while saving the bill. Please try again.", "error");
    } finally {
      setBusy(null);
    }
  };

  if (!isReady) {
    return <div className="text-sm text-[rgb(var(--text-muted))]">Loading&hellip;</div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header info */}
      <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5 shadow-soft">
        <h2 className="text-base font-semibold text-[rgb(var(--text))]">Create New Bill</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[rgb(var(--text-muted))]">
              Bill Number
            </p>
            <p className="mt-1 text-sm font-semibold text-[rgb(var(--text))]">{nextBillNumberPreview}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[rgb(var(--text-muted))]">
              Date
            </p>
            <p className="mt-1 text-sm font-semibold text-[rgb(var(--text))]">
              {formatDateDisplay(todayIso())}
            </p>
          </div>
          <div>
            <label htmlFor="customer-name" className="mb-1.5 block text-sm font-medium text-[rgb(var(--text))]">
              Customer Name <span className="font-normal text-[rgb(var(--text-muted))]">(optional)</span>
            </label>
            <input
              id="customer-name"
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Walk-in customer"
              className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3.5 py-2.5 text-sm focus:border-spice-400 focus:outline-none focus:ring-2 focus:ring-spice-400/30"
            />
          </div>
          <div>
            <label htmlFor="customer-phone" className="mb-1.5 block text-sm font-medium text-[rgb(var(--text))]">
              Customer Phone <span className="font-normal text-[rgb(var(--text-muted))]">(optional)</span>
            </label>
            <input
              id="customer-phone"
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="9876543210"
              className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3.5 py-2.5 text-sm focus:border-spice-400 focus:outline-none focus:ring-2 focus:ring-spice-400/30"
            />
          </div>
        </div>
      </div>

      {/* Product selector */}
      {activeProducts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[rgb(var(--border))] p-6 text-center text-sm text-[rgb(var(--text-muted))]">
          No active products available for billing. Add products from the Products page first.
        </div>
      ) : (
        <ProductSelector products={activeProducts} onAdd={handleAddItem} />
      )}

      {/* Bill items */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-[rgb(var(--text))]">Bill Items</h3>
        <BillItemsTable items={items} onRemove={handleRemoveItem} />
      </div>

      {/* Totals */}
      <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5 shadow-soft">
        <div className="ml-auto max-w-xs space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[rgb(var(--text-muted))]">Subtotal</span>
            <span className="font-medium text-[rgb(var(--text))]">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <label htmlFor="discount" className="text-[rgb(var(--text-muted))]">
              Discount (\u20B9)
            </label>
            <input
              id="discount"
              type="number"
              min={0}
              max={subtotal}
              value={discount === 0 ? "" : discount}
              onChange={(e) => setDiscount(Number(e.target.value) || 0)}
              placeholder="0"
              className="w-28 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-1.5 text-right text-sm focus:border-spice-400 focus:outline-none focus:ring-2 focus:ring-spice-400/30"
            />
          </div>
          <div className="flex items-center justify-between border-t border-[rgb(var(--border))] pt-3 text-base font-bold text-[rgb(var(--text))]">
            <span>Grand Total</span>
            <span>{formatCurrency(grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-end gap-2 pb-4">
        <button
          onClick={clearForm}
          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--border))]/60"
        >
          <RotateCcw className="h-4 w-4" /> Clear
        </button>
        <button
          onClick={() => handleSave("save")}
          disabled={busy !== null}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-4 py-2.5 text-sm font-semibold text-[rgb(var(--text))] shadow-soft transition hover:bg-[rgb(var(--border))]/40 disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> Save Bill
        </button>
        <button
          onClick={() => handleSave("print")}
          disabled={busy !== null}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-4 py-2.5 text-sm font-semibold text-[rgb(var(--text))] shadow-soft transition hover:bg-[rgb(var(--border))]/40 disabled:opacity-50"
        >
          <Printer className="h-4 w-4" /> Save &amp; Print
        </button>
        <button
          onClick={() => handleSave("pdf")}
          disabled={busy !== null}
          className="inline-flex items-center gap-1.5 rounded-xl bg-spice-600 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-spice-700 disabled:opacity-50"
        >
          <Download className="h-4 w-4" /> {busy === "pdf" ? "Generating PDF..." : "Save PDF"}
        </button>
      </div>

      {/* Hidden invoice used purely for PDF capture */}
      {pdfBill && (
        <div className="pointer-events-none fixed left-[-9999px] top-0">
          <InvoiceTemplate bill={pdfBill} settings={data.settings} innerRef={hiddenInvoiceRef} />
        </div>
      )}
    </div>
  );
}
