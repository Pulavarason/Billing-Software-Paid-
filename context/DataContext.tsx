"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode
} from "react";
import { AppData, Bill, BusinessSettings, Product } from "@/lib/types";
import {
  addBillToData,
  addProductToData,
  buildBackup,
  clearAllData,
  deleteBillFromData,
  deleteProductFromData,
  parseBackupFile,
  resetToDemoData,
  updateProductInData,
  updateBillInData,
  updateSettingsInData
} from "@/lib/storage";
import { formatBillNumber } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";
import { downloadExcelExport } from "@/lib/excel";
import { createClient } from "@/lib/supabase/client";

interface DataContextValue {
  data: AppData;
  isReady: boolean;
  nextBillNumberPreview: string;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  addBill: (bill: Omit<Bill, "id" | "billNumber" | "createdAt">) => Bill;
  deleteBill: (billId: string) => void;
  updateBill: (bill: Bill) => void;
  recordPayment: (billId: string, amount: number) => void;
  updateSettings: (settings: BusinessSettings) => void;
  exportBackup: () => void;
  exportExcel: () => void;
  importBackup: (file: File) => Promise<void>;
  resetDemoData: () => void;
  wipeAllData: () => void;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

const emptyData: AppData = {
  version: 1,
  products: [],
  bills: [],
  billCounter: 1,
  settings: {
    businessName: "",
    tagline: "",
    address: "",
    phone: "",
    email: "",
    gstNumber: "",
    invoiceFooter: "Thank you for your business!"
  }
};

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [data, setData] = useState<AppData>(emptyData);
  const dataRef = useRef<AppData>(emptyData);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (isAuthLoading) return;

    let cancelled = false;
    setIsReady(false);
    const loadCloudData = async () => {
      if (!user) { dataRef.current = emptyData; setData(emptyData); setIsReady(true); return; }
      const supabase = createClient();
      const { data: row, error } = await supabase.from("account_data").select("data").eq("user_id", user.id).maybeSingle();
      if (cancelled) return;
      if (error) console.error("Could not load account data from Supabase", error.message);
      const businessName = user.user_metadata?.business_name;
      const loaded = (row?.data as AppData | null) ?? emptyData;
      const next = typeof businessName === "string" && businessName.trim() && !loaded.settings.businessName
        ? { ...loaded, settings: { ...loaded.settings, businessName: businessName.trim() } }
        : loaded;
      dataRef.current = next;
      setData(next);
      setIsReady(true);
      if (!row && !error) await supabase.from("account_data").upsert({ user_id: user.id, data: next });
      else if (next !== loaded) await supabase.from("account_data").upsert({ user_id: user.id, data: next });
    };
    void loadCloudData();
    return () => { cancelled = true; };
  }, [isAuthLoading, user?.id, user?.user_metadata?.business_name]);

  const persist = useCallback((updater: (prev: AppData) => AppData) => {
    const next = updater(dataRef.current);
    dataRef.current = next;
    setData(next);
    if (user?.id) {
      void createClient().from("account_data").upsert({ user_id: user.id, data: next, updated_at: new Date().toISOString() })
        .then(({ error }) => { if (error) console.error("Could not save account data to Supabase", error.message); });
    }
  }, [user?.id]);

  const addProduct = useCallback(
    (product: Product) => persist((prev) => addProductToData(prev, product)),
    [persist]
  );

  const updateProduct = useCallback(
    (product: Product) => persist((prev) => updateProductInData(prev, product)),
    [persist]
  );

  const deleteProduct = useCallback(
    (productId: string) => persist((prev) => deleteProductFromData(prev, productId)),
    [persist]
  );

  const addBill = useCallback(
    (bill: Omit<Bill, "id" | "billNumber" | "createdAt">): Bill => {
      const grandTotal = Math.max(0, bill.grandTotal);
      const paidAmount = Math.min(Math.max(0, bill.paidAmount ?? grandTotal), grandTotal);
      const billNumber = formatBillNumber(data.billCounter);
      const fullBill: Bill = {
        ...bill,
        deliveryCharge: Math.max(0, bill.deliveryCharge ?? 0),
        paidAmount,
        dueAmount: Math.max(0, grandTotal - paidAmount),
        id: `bill_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        billNumber,
        createdAt: new Date().toISOString()
      };
      persist((prev) => addBillToData(prev, fullBill));
      return fullBill;
    },
    [persist, data.billCounter]
  );

  const updateBill = useCallback((bill: Bill) => persist((prev) => updateBillInData(prev, bill)), [persist]);

  const recordPayment = useCallback((billId: string, amount: number) => {
    if (!Number.isFinite(amount) || amount <= 0) return;
    persist((prev) => {
      const bill = prev.bills.find((entry) => entry.id === billId);
      if (!bill) return prev;
      const total = Math.max(0, bill.grandTotal);
      const paidAmount = Math.min(total, (bill.paidAmount ?? total) + amount);
      return updateBillInData(prev, { ...bill, paidAmount, dueAmount: Math.max(0, total - paidAmount) });
    });
  }, [persist]);

  const deleteBill = useCallback(
    (billId: string) => persist((prev) => deleteBillFromData(prev, billId)),
    [persist]
  );

  const updateSettings = useCallback(
    (settings: BusinessSettings) =>
      persist((prev) => updateSettingsInData(prev, settings)),
    [persist]
  );

  const exportBackup = useCallback(() => {
    const backup = buildBackup(data);
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `skandhas-masala-backup-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [data]);

  const exportExcel = useCallback(() => downloadExcelExport(data), [data]);

  const importBackup = useCallback(async (file: File) => {
    const text = await file.text();
    const parsed = parseBackupFile(text);
    dataRef.current = parsed;
    setData(parsed);
    if (user?.id) {
      const { error } = await createClient().from("account_data").upsert({ user_id: user.id, data: parsed, updated_at: new Date().toISOString() });
      if (error) throw error;
    }
  }, [user?.id]);

  const resetDemoData = useCallback(() => {
    const fresh = resetToDemoData(user?.id);
    dataRef.current = fresh;
    setData(fresh);
    if (user?.id) void createClient().from("account_data").upsert({ user_id: user.id, data: fresh, updated_at: new Date().toISOString() });
  }, [user?.id]);

  const wipeAllData = useCallback(() => {
    const empty = clearAllData(user?.id);
    dataRef.current = empty;
    setData(empty);
    if (user?.id) void createClient().from("account_data").upsert({ user_id: user.id, data: empty, updated_at: new Date().toISOString() });
  }, [user?.id]);

  const nextBillNumberPreview = formatBillNumber(data.billCounter);

  return (
    <DataContext.Provider
      value={{
        data,
        isReady,
        nextBillNumberPreview,
        addProduct,
        updateProduct,
        deleteProduct,
        addBill,
        deleteBill,
        updateBill,
        recordPayment,
        updateSettings,
        exportBackup,
        exportExcel,
        importBackup,
        resetDemoData,
        wipeAllData
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
