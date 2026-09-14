"use client";

import { useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, Printer, Receipt } from "lucide-react";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import InvoiceTemplate from "@/components/InvoiceTemplate";
import EmptyState from "@/components/EmptyState";
import { generateInvoicePdf } from "@/lib/pdf";

export default function ViewBillPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isReady } = useData();
  const { showToast } = useToast();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);

  const bill = data.bills.find((b) => b.id === params.id);

  const handlePrint = () => {
    window.open(`/print/${params.id}`, "_blank");
  };

  const handlePdf = async () => {
    if (!invoiceRef.current || !bill) return;
    setGenerating(true);
    try {
      await generateInvoicePdf(invoiceRef.current, `${bill.billNumber}.pdf`);
      showToast(`${bill.billNumber}.pdf downloaded.`);
    } catch {
      showToast("Could not generate the PDF. Please try again.", "error");
    } finally {
      setGenerating(false);
    }
  };

  if (!isReady) {
    return <div className="text-sm text-[rgb(var(--text-muted))]">Loading&hellip;</div>;
  }

  if (!bill) {
    return (
      <div className="mx-auto max-w-2xl">
        <EmptyState
          icon={Receipt}
          title="Bill not found"
          description="This bill may have been deleted."
          action={
            <button
              onClick={() => router.push("/bills")}
              className="inline-flex items-center gap-2 rounded-lg bg-spice-600 px-4 py-2 text-sm font-medium text-white hover:bg-spice-700"
            >
              Back to Bills
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <Link
          href="/bills"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))]"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Bills
        </Link>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-4 py-2.5 text-sm font-semibold text-[rgb(var(--text))] shadow-soft transition hover:bg-[rgb(var(--border))]/40"
          >
            <Printer className="h-4 w-4" /> Print
          </button>
          <button
            onClick={handlePdf}
            disabled={generating}
            className="inline-flex items-center gap-1.5 rounded-xl bg-spice-600 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-spice-700 disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> {generating ? "Generating..." : "Save PDF"}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-gray-100 p-4 shadow-soft dark:bg-gray-900/40 sm:p-8">
        <div className="mx-auto w-full max-w-[420px] overflow-hidden rounded-lg shadow-card">
          <InvoiceTemplate bill={bill} settings={data.settings} innerRef={invoiceRef} />
        </div>
      </div>
    </div>
  );
}
