"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Receipt, RotateCcw, Save } from "lucide-react";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import ProductSelector from "@/components/ProductSelector";
import BillItemsTable from "@/components/BillItemsTable";
import EmptyState from "@/components/EmptyState";
import { Bill, BillItem } from "@/lib/types";
import { formatCurrency, formatDateDisplay } from "@/lib/format";

export default function EditBillPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isReady, updateBill } = useData();
  const { showToast } = useToast();
  const bill = data.bills.find((entry) => entry.id === params.id);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [items, setItems] = useState<BillItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [deliveryCharge, setDeliveryCharge] = useState(0);

  useEffect(() => {
    if (!bill) return;
    setCustomerName(bill.customerName ?? "");
    setCustomerPhone(bill.customerPhone ?? "");
    setItems(bill.items);
    setDiscount(bill.discount);
    setDeliveryCharge(bill.deliveryCharge ?? 0);
  }, [bill]);

  const activeProducts = useMemo(
    () => data.products.filter((product) => product.status === "active" && product.variants.length > 0),
    [data.products]
  );
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const safeDiscount = Math.min(Math.max(discount, 0), subtotal);
  const safeDeliveryCharge = Math.max(deliveryCharge, 0);
  const grandTotal = Math.max(0, subtotal - safeDiscount + safeDeliveryCharge);

  const addItem = (item: Omit<BillItem, "amount">) => {
    setItems((current) => [...current, { ...item, amount: item.price * item.quantity }]);
  };

  const reset = () => {
    if (!bill) return;
    setCustomerName(bill.customerName ?? "");
    setCustomerPhone(bill.customerPhone ?? "");
    setItems(bill.items);
    setDiscount(bill.discount);
    setDeliveryCharge(bill.deliveryCharge ?? 0);
  };

  const save = () => {
    if (!bill) return;
    if (items.length === 0) {
      showToast("Add at least one item before saving the bill.", "error");
      return;
    }
    const previousPaid = bill.paidAmount ?? bill.grandTotal;
    const paidAmount = Math.min(previousPaid, grandTotal);
    updateBill({
      ...bill,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      items,
      subtotal,
      discount: safeDiscount,
      deliveryCharge: safeDeliveryCharge,
      grandTotal,
      paidAmount,
      dueAmount: Math.max(0, grandTotal - paidAmount)
    });
    showToast(`Bill ${bill.billNumber} updated successfully.`);
    router.push(`/bills/${bill.id}`);
  };

  if (!isReady) return <div className="text-sm text-[rgb(var(--text-muted))]">Loading&hellip;</div>;
  if (!bill) return <EmptyState icon={Receipt} title="Bill not found" description="This bill may have been deleted." />;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[rgb(var(--text))]">Edit Bill {bill.billNumber}</h2>
          <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">{formatDateDisplay(bill.date)}</p>
        </div>
        <Link href={`/bills/${bill.id}`} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--border))]/60">
          <ArrowLeft className="h-4 w-4" /> Cancel
        </Link>
      </div>

      <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5 shadow-soft">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-[rgb(var(--text))]">Customer Name
            <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Walk-in customer" className="mt-1.5 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3.5 py-2.5 text-sm focus:border-spice-400 focus:outline-none focus:ring-2 focus:ring-spice-400/30" />
          </label>
          <label className="text-sm font-medium text-[rgb(var(--text))]">Customer Phone
            <input value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} placeholder="9876543210" className="mt-1.5 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3.5 py-2.5 text-sm focus:border-spice-400 focus:outline-none focus:ring-2 focus:ring-spice-400/30" />
          </label>
        </div>
      </div>

      {activeProducts.length === 0 ? (
        <EmptyState icon={Receipt} title="No active products" description="Add an active product before changing bill items." />
      ) : (
        <ProductSelector products={activeProducts} onAdd={addItem} />
      )}

      <div>
        <h3 className="mb-3 text-sm font-semibold text-[rgb(var(--text))]">Bill Items</h3>
        <BillItemsTable items={items} onRemove={(index) => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))} />
      </div>

      <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5 shadow-soft">
        <div className="ml-auto max-w-xs space-y-3">
          <div className="flex justify-between text-sm"><span className="text-[rgb(var(--text-muted))]">Subtotal</span><span className="font-medium">{formatCurrency(subtotal)}</span></div>
          <label className="flex items-center justify-between gap-3 text-sm text-[rgb(var(--text-muted))]">Discount (₹)
            <input type="number" min={0} max={subtotal} value={discount || ""} onChange={(event) => setDiscount(Number(event.target.value) || 0)} className="w-28 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-1.5 text-right text-sm" />
          </label>
          <label className="flex items-center justify-between gap-3 text-sm text-[rgb(var(--text-muted))]">Delivery charge (₹)
            <input type="number" min={0} value={deliveryCharge || ""} onChange={(event) => setDeliveryCharge(Number(event.target.value) || 0)} className="w-28 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-1.5 text-right text-sm" />
          </label>
          <div className="flex justify-between border-t border-[rgb(var(--border))] pt-3 text-base font-bold"><span>Grand Total</span><span>{formatCurrency(grandTotal)}</span></div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pb-4">
        <button type="button" onClick={reset} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--border))]/60"><RotateCcw className="h-4 w-4" /> Reset</button>
        <button type="button" onClick={save} className="inline-flex items-center gap-2 rounded-xl bg-spice-600 px-4 py-2.5 text-sm font-semibold text-white shadow-soft hover:bg-spice-700"><Save className="h-4 w-4" /> Save Changes</button>
      </div>
    </div>
  );
}