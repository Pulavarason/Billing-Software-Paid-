import { AppData, BackupFile, Bill, BusinessSettings, Product } from "./types";
import { buildInitialData } from "./sample-data";
import { formatBillNumber } from "./format";

const STORAGE_KEY_PREFIX = "billing-software-data-v1";
const APP_VERSION = 1;

export class StorageError extends Error {}

/** Basic structural validation for data loaded from localStorage or an import file. */
function isValidAppData(data: unknown): data is AppData {
  if (!data || typeof data !== "object") return false;
  const d = data as Partial<AppData>;
  if (!Array.isArray(d.products) || !Array.isArray(d.bills)) return false;
  if (!d.settings || typeof d.settings !== "object") return false;
  if (typeof d.billCounter !== "number") return false;
  return true;
}

function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === "undefined") return false;
    const testKey = "__skm_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/** A brand-new customer's local data: no demo/dummy products or bills. */
function storageKey(userId?: string): string {
  return userId ? `${STORAGE_KEY_PREFIX}:${userId}` : STORAGE_KEY_PREFIX;
}

function buildEmptyData(): AppData {
  return {
    version: APP_VERSION,
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
}

export function loadData(userId?: string): AppData {
  if (!isLocalStorageAvailable()) {
    // No persistent storage available (private browsing, disabled storage, etc.)
    // Fall back to a fresh, empty in-memory dataset so the app still works.
    return buildEmptyData();
  }

  try {
    const key = storageKey(userId);
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      // Fresh installation — start with no demo products/bills.
      const initial = buildEmptyData();
      persist(initial, userId);
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (!isValidAppData(parsed)) {
      throw new StorageError("Corrupted data shape");
    }
    return parsed;
  } catch (err) {
    // Corrupted / invalid JSON — recover gracefully instead of crashing the app.
    const initial = buildEmptyData();
    try {
      persist(initial, userId);
    } catch {
      /* ignore secondary failure */
    }
    return initial;
  }
}

function persist(data: AppData, userId?: string): void {
  if (!isLocalStorageAvailable()) return;
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(data));
  } catch (err) {
    throw new StorageError(
      "Could not save data to your browser's storage. It may be full or disabled."
    );
  }
}

export function saveData(data: AppData, userId?: string): void {
  persist(data, userId);
}

export function nextBillNumber(data: AppData): string {
  return formatBillNumber(data.billCounter);
}

export function addProductToData(data: AppData, product: Product): AppData {
  return { ...data, products: [product, ...data.products] };
}

export function updateProductInData(data: AppData, product: Product): AppData {
  return {
    ...data,
    products: data.products.map((p) => (p.id === product.id ? product : p))
  };
}

export function deleteProductFromData(data: AppData, productId: string): AppData {
  return {
    ...data,
    products: data.products.filter((p) => p.id !== productId)
  };
}

export function addBillToData(data: AppData, bill: Bill): AppData {
  return {
    ...data,
    bills: [bill, ...data.bills],
    billCounter: data.billCounter + 1
  };
}

export function deleteBillFromData(data: AppData, billId: string): AppData {
  return { ...data, bills: data.bills.filter((b) => b.id !== billId) };
}

export function updateBillInData(data: AppData, bill: Bill): AppData {
  return { ...data, bills: data.bills.map((existing) => existing.id === bill.id ? bill : existing) };
}

export function updateSettingsInData(
  data: AppData,
  settings: BusinessSettings
): AppData {
  return { ...data, settings };
}

export function buildBackup(data: AppData): BackupFile {
  return {
    exportedAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    data
  };
}

export function parseBackupFile(raw: string): AppData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new StorageError("This file is not valid JSON.");
  }
  const backup = parsed as Partial<BackupFile>;
  const candidate = backup && typeof backup === "object" && "data" in backup
    ? (backup as BackupFile).data
    : (parsed as AppData);

  if (!isValidAppData(candidate)) {
    throw new StorageError(
      "This backup file doesn't match the expected format."
    );
  }
  return candidate;
}

export function resetToDemoData(userId?: string): AppData {
  const fresh = buildInitialData();
  persist(fresh, userId);
  return fresh;
}

export function clearAllData(userId?: string): AppData {
  const empty: AppData = {
    version: APP_VERSION,
    products: [],
    bills: [],
    billCounter: 1,
    settings: buildInitialData().settings
  };
  persist(empty, userId);
  return empty;
}
