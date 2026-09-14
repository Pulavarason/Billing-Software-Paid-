"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
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
  loadData,
  parseBackupFile,
  resetToDemoData,
  saveData,
  updateProductInData,
  updateSettingsInData
} from "@/lib/storage";
import { formatBillNumber } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";

interface DataContextValue {
  data: AppData;
  isReady: boolean;
  nextBillNumberPreview: string;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  addBill: (bill: Omit<Bill, "id" | "billNumber" | "createdAt">) => Bill;
  deleteBill: (billId: string) => void;
  updateSettings: (settings: BusinessSettings) => void;
  exportBackup: () => void;
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
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (isAuthLoading) return;

    const loaded = loadData(user?.id);
    const businessName = user?.user_metadata?.business_name;
    const shouldSetBusinessName =
      typeof businessName === "string" && businessName.trim() && !loaded.settings.businessName;
    const next = shouldSetBusinessName
      ? { ...loaded, settings: { ...loaded.settings, businessName: businessName.trim() } }
      : loaded;

    if (shouldSetBusinessName) saveData(next, user?.id);
    setData(next);
    setIsReady(true);
  }, [isAuthLoading, user?.id, user?.user_metadata?.business_name]);

  const persist = useCallback((updater: (prev: AppData) => AppData) => {
    setData((prev) => {
      const next = updater(prev);
      saveData(next, user?.id);
      return next;
    });
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
      const billNumber = formatBillNumber(data.billCounter);
      const fullBill: Bill = {
        ...bill,
        id: `bill_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        billNumber,
        createdAt: new Date().toISOString()
      };
      persist((prev) => addBillToData(prev, fullBill));
      return fullBill;
    },
    [persist, data.billCounter]
  );

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

  const importBackup = useCallback(async (file: File) => {
    const text = await file.text();
    const parsed = parseBackupFile(text);
    saveData(parsed, user?.id);
    setData(parsed);
  }, [user?.id]);

  const resetDemoData = useCallback(() => {
    const fresh = resetToDemoData(user?.id);
    setData(fresh);
  }, [user?.id]);

  const wipeAllData = useCallback(() => {
    const empty = clearAllData(user?.id);
    setData(empty);
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
        updateSettings,
        exportBackup,
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
