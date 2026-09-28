import type { Ref } from "react";
import { Bill, BusinessSettings } from "@/lib/types";
import { formatCurrency, formatDateSlash } from "@/lib/format";

interface InvoiceTemplateProps {
  bill: Bill;
  settings: BusinessSettings;
  innerRef?: Ref<HTMLDivElement>;
}

export default function InvoiceTemplate({ bill, settings, innerRef }: InvoiceTemplateProps) {
  const hasGst = Boolean(settings.gstNumber && settings.gstNumber.trim().length > 0);

  return (
    <div
      ref={innerRef}
      className="invoice-a5 mx-auto flex flex-col p-6 text-[13px] leading-snug text-black"
      style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
    >
      {/* Header */}
      <div className="text-center">
        <h1 className="text-xl font-bold uppercase tracking-wide">
          {settings.businessName || "Your Business"}
        </h1>
        <p className="mt-0.5 text-[11px]">{settings.tagline}</p>
        <p className="mt-1.5 whitespace-pre-line text-[11px]">{settings.address}</p>
        <p className="text-[11px]">
          {settings.phone}
          {settings.email ? ` \u00B7 ${settings.email}` : ""}
        </p>
        {hasGst && <p className="text-[11px]">GSTIN: {settings.gstNumber}</p>}
      </div>

      <div className="my-3 border-t-2 border-black" />

      {/* Bill meta */}
      <div className="flex items-start justify-between text-[12px]">
        <div>
          <p>
            <span className="font-semibold">Bill No:</span> {bill.billNumber}
          </p>
          <p>
            <span className="font-semibold">Date:</span> {formatDateSlash(bill.date)}
            {bill.time ? `  ${bill.time}` : ""}
          </p>
        </div>
        {(bill.customerName || bill.customerPhone) && (
          <div className="text-right">
            <p className="font-semibold">Customer</p>
            {bill.customerName && <p>{bill.customerName}</p>}
            {bill.customerPhone && <p>{bill.customerPhone}</p>}
          </div>
        )}
      </div>

      <div className="my-3 border-t border-dashed border-black" />

      {/* Items table */}
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr className="border-b-2 border-black text-left">
            <th className="py-1 font-semibold">Item</th>
            <th className="py-1 font-semibold">Size</th>
            <th className="py-1 text-right font-semibold">Qty</th>
            <th className="py-1 text-right font-semibold">Rate</th>
            <th className="py-1 text-right font-semibold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {bill.items.map((item, idx) => (
            <tr key={`${item.variantId}-${idx}`} className="border-b border-dotted border-black/40">
              <td className="py-1 pr-1">{item.productName}</td>
              <td className="py-1 pr-1">{item.variantSize}</td>
              <td className="py-1 text-right">{item.quantity}</td>
              <td className="py-1 text-right">{formatCurrency(item.price)}</td>
              <td className="py-1 text-right">{formatCurrency(item.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="my-2 border-t border-black" />

      {/* Totals */}
      <div className="ml-auto w-full max-w-[60%] space-y-1 text-[12px]">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatCurrency(bill.subtotal)}</span>
        </div>
        {bill.discount > 0 && (
          <div className="flex justify-between">
            <span>Discount</span>
            <span>- {formatCurrency(bill.discount)}</span>
          </div>
        )}
        {(bill.deliveryCharge ?? 0) > 0 && (
          <div className="flex justify-between">
            <span>Delivery charge</span>
            <span>{formatCurrency(bill.deliveryCharge)}</span>
          </div>
        )}
        <div className="flex justify-between border-t-2 border-black pt-1 text-[14px] font-bold">
          <span>TOTAL</span>
          <span>{formatCurrency(bill.grandTotal)}</span>
        </div>
      </div>

      <div className="mt-auto pt-6 text-center">
        <div className="mb-2 border-t border-dashed border-black" />
        <p className="text-[12px] font-medium">{settings.invoiceFooter}</p>
        <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide">
          {settings.businessName || "Your Business"}
        </p>
      </div>
    </div>
  );
}
