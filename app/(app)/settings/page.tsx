"use client";

import { useEffect, useRef, useState, FormEvent, ChangeEvent } from "react";
import { Database, Download, RotateCcw, Save, Trash2, Upload } from "lucide-react";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import ConfirmDialog from "@/components/ConfirmDialog";
import { BusinessSettings } from "@/lib/types";
import { StorageError } from "@/lib/storage";

export default function SettingsPage() {
  const { data, isReady, updateSettings, exportBackup, exportExcel, importBackup, resetDemoData, wipeAllData } =
    useData();
  const { showToast } = useToast();

  const [form, setForm] = useState<BusinessSettings>(data.settings);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [wipeDialogOpen, setWipeDialogOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isReady) setForm(data.settings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]);

  const handleField = (field: keyof BusinessSettings, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    updateSettings({
      ...form,
      businessName: form.businessName.trim() || "Your Business"
    });
    showToast("Settings saved. Future bills will use these details.");
  };

  const handleFileChosen = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setImportDialogOpen(true);
  };

  const confirmImport = async () => {
    if (!pendingFile) return;
    try {
      await importBackup(pendingFile);
      showToast("Backup restored successfully.");
    } catch (err) {
      const message =
        err instanceof StorageError || err instanceof Error
          ? err.message
          : "Could not import this backup file.";
      showToast(message, "error");
    } finally {
      setPendingFile(null);
      setImportDialogOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const confirmReset = () => {
    resetDemoData();
    setResetDialogOpen(false);
    showToast("Demo data restored.");
  };

  const confirmWipe = () => {
    wipeAllData();
    setWipeDialogOpen(false);
    showToast("All data cleared.", "info");
  };

  if (!isReady) {
    return <div className="text-sm text-[rgb(var(--text-muted))]">Loading&hellip;</div>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Business info */}
      <form
        onSubmit={handleSave}
        className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5 shadow-soft sm:p-6"
      >
        <h2 className="text-base font-semibold text-[rgb(var(--text))]">Business Information</h2>
        <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
          These details appear on every printed invoice.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="s-name" className="mb-1.5 block text-sm font-medium text-[rgb(var(--text))]">
              Business Name
            </label>
            <input
              id="s-name"
              type="text"
              value={form.businessName}
              onChange={(e) => handleField("businessName", e.target.value)}
              className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3.5 py-2.5 text-sm focus:border-spice-400 focus:outline-none focus:ring-2 focus:ring-spice-400/30"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="s-tagline" className="mb-1.5 block text-sm font-medium text-[rgb(var(--text))]">
              Tagline
            </label>
            <input
              id="s-tagline"
              type="text"
              value={form.tagline}
              onChange={(e) => handleField("tagline", e.target.value)}
              className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3.5 py-2.5 text-sm focus:border-spice-400 focus:outline-none focus:ring-2 focus:ring-spice-400/30"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="s-address" className="mb-1.5 block text-sm font-medium text-[rgb(var(--text))]">
              Address
            </label>
            <textarea
              id="s-address"
              rows={3}
              value={form.address}
              onChange={(e) => handleField("address", e.target.value)}
              className="w-full resize-none rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3.5 py-2.5 text-sm focus:border-spice-400 focus:outline-none focus:ring-2 focus:ring-spice-400/30"
            />
          </div>

          <div>
            <label htmlFor="s-phone" className="mb-1.5 block text-sm font-medium text-[rgb(var(--text))]">
              Phone
            </label>
            <input
              id="s-phone"
              type="text"
              value={form.phone}
              onChange={(e) => handleField("phone", e.target.value)}
              className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3.5 py-2.5 text-sm focus:border-spice-400 focus:outline-none focus:ring-2 focus:ring-spice-400/30"
            />
          </div>

          <div>
            <label htmlFor="s-email" className="mb-1.5 block text-sm font-medium text-[rgb(var(--text))]">
              Email
            </label>
            <input
              id="s-email"
              type="email"
              value={form.email}
              onChange={(e) => handleField("email", e.target.value)}
              className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3.5 py-2.5 text-sm focus:border-spice-400 focus:outline-none focus:ring-2 focus:ring-spice-400/30"
            />
          </div>

          <div>
            <label htmlFor="s-gst" className="mb-1.5 block text-sm font-medium text-[rgb(var(--text))]">
              GST Number <span className="font-normal text-[rgb(var(--text-muted))]">(optional)</span>
            </label>
            <input
              id="s-gst"
              type="text"
              value={form.gstNumber ?? ""}
              onChange={(e) => handleField("gstNumber", e.target.value)}
              placeholder="Leave blank to hide from invoice"
              className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3.5 py-2.5 text-sm focus:border-spice-400 focus:outline-none focus:ring-2 focus:ring-spice-400/30"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="s-footer" className="mb-1.5 block text-sm font-medium text-[rgb(var(--text))]">
              Invoice Footer
            </label>
            <input
              id="s-footer"
              type="text"
              value={form.invoiceFooter}
              onChange={(e) => handleField("invoiceFooter", e.target.value)}
              className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3.5 py-2.5 text-sm focus:border-spice-400 focus:outline-none focus:ring-2 focus:ring-spice-400/30"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end border-t border-[rgb(var(--border))] pt-4">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-xl bg-spice-600 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-spice-700"
          >
            <Save className="h-4 w-4" /> Save Settings
          </button>
        </div>
      </form>

      {/* Data management */}
      <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5 shadow-soft sm:p-6">
        <div className="flex items-center gap-2.5">
          <Database className="h-5 w-5 text-spice-600 dark:text-spice-400" />
          <h2 className="text-base font-semibold text-[rgb(var(--text))]">Data Management</h2>
        </div>
        <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
          Everything is stored locally in this browser. Export a backup regularly so you never lose data.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:max-w-xs">
          <div className="rounded-xl border border-[rgb(var(--border))] p-3 text-center">
            <p className="text-lg font-semibold text-[rgb(var(--text))]">{data.products.length}</p>
            <p className="text-xs text-[rgb(var(--text-muted))]">Products</p>
          </div>
          <div className="rounded-xl border border-[rgb(var(--border))] p-3 text-center">
            <p className="text-lg font-semibold text-[rgb(var(--text))]">{data.bills.length}</p>
            <p className="text-xs text-[rgb(var(--text-muted))]">Bills</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={exportExcel}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-4 py-2.5 text-sm font-semibold text-[rgb(var(--text))] shadow-soft transition hover:bg-[rgb(var(--border))]/40"
          >
            <Download className="h-4 w-4" /> Export Excel
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-4 py-2.5 text-sm font-semibold text-[rgb(var(--text))] shadow-soft transition hover:bg-[rgb(var(--border))]/40"
          >
            <Upload className="h-4 w-4" /> Import JSON Backup
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleFileChosen}
            className="hidden"
          />
        </div>

        <div className="mt-6 border-t border-[rgb(var(--border))] pt-5">
          <p className="text-sm font-semibold text-[rgb(var(--text))]">Danger Zone</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => setResetDialogOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 px-4 py-2.5 text-sm font-medium text-amber-700 transition hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/20"
            >
              <RotateCcw className="h-4 w-4" /> Reset Demo Data
            </button>
            <button
              onClick={() => setWipeDialogOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-300 px-4 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <Trash2 className="h-4 w-4" /> Clear All Data
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={importDialogOpen}
        title="Replace existing data?"
        description="Importing this backup will overwrite all current products, bills and settings. This cannot be undone."
        confirmLabel="Import & Replace"
        onConfirm={confirmImport}
        onCancel={() => {
          setImportDialogOpen(false);
          setPendingFile(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }}
      />

      <ConfirmDialog
        open={resetDialogOpen}
        title="Reset to demo data?"
        description="This replaces all current products, bills and settings with the original sample dataset."
        confirmLabel="Reset"
        onConfirm={confirmReset}
        onCancel={() => setResetDialogOpen(false)}
      />

      <ConfirmDialog
        open={wipeDialogOpen}
        title="Clear all data?"
        description="This permanently deletes every product and bill. This cannot be undone."
        confirmLabel="Clear Everything"
        onConfirm={confirmWipe}
        onCancel={() => setWipeDialogOpen(false)}
      />
    </div>
  );
}
