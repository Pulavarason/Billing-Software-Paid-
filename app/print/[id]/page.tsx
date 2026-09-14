"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useData } from "@/context/DataContext";
import InvoiceTemplate from "@/components/InvoiceTemplate";

export default function PrintBillPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isReady } = useData();
  const [printed, setPrinted] = useState(false);

  const bill = data.bills.find((b) => b.id === params.id);

  useEffect(() => {
    if (isReady && bill && !printed) {
      setPrinted(true);
      const timer = setTimeout(() => {
        window.print();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isReady, bill, printed]);

  if (!isReady) {
    return <div className="p-8 text-sm text-gray-500">Loading invoice&hellip;</div>;
  }

  if (!bill) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-base font-semibold text-gray-800">Bill not found</p>
        <p className="text-sm text-gray-500">
          This bill may have been deleted or the link is invalid.
        </p>
        <button
          onClick={() => router.push("/bills")}
          className="no-print mt-2 rounded-lg bg-gray-800 px-4 py-2 text-sm text-white"
        >
          Back to Bills
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen justify-center bg-gray-200 py-8 print:bg-white print:py-0">
      <InvoiceTemplate bill={bill} settings={data.settings} />
    </div>
  );
}
