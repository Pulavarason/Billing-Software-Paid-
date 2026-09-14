"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Variant } from "@/lib/types";
import { generateId } from "@/lib/id";

interface VariantEditorProps {
  variants: Variant[];
  onChange: (variants: Variant[]) => void;
  error?: string;
}

export default function VariantEditor({ variants, onChange, error }: VariantEditorProps) {
  const update = (id: string, patch: Partial<Variant>) => {
    onChange(variants.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  };

  const remove = (id: string) => {
    onChange(variants.filter((v) => v.id !== id));
  };

  const add = () => {
    onChange([...variants, { id: generateId("var"), size: "", price: 0, sku: "" }]);
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= variants.length) return;
    const next = [...variants];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-[rgb(var(--text))]">Package Variants</label>
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-1.5 rounded-lg border border-spice-300 px-3 py-1.5 text-xs font-medium text-spice-700 transition hover:bg-spice-50 dark:border-spice-700 dark:text-spice-400 dark:hover:bg-spice-900/30"
        >
          <Plus className="h-3.5 w-3.5" /> Add Variant
        </button>
      </div>

      {error && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>}

      {variants.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-[rgb(var(--border))] p-4 text-center text-xs text-[rgb(var(--text-muted))]">
          No variants added yet. Click &ldquo;Add Variant&rdquo; to create a package size (e.g. 250 g).
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          <div className="hidden grid-cols-[1fr_1fr_1fr_auto] gap-2 px-1 text-xs font-medium text-[rgb(var(--text-muted))] sm:grid">
            <span>Package Size</span>
            <span>Selling Price (\u20B9)</span>
            <span>SKU (optional)</span>
            <span />
          </div>
          {variants.map((variant, idx) => (
            <div
              key={variant.id}
              className="grid grid-cols-2 gap-2 rounded-xl border border-[rgb(var(--border))] p-2.5 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-center sm:p-2"
            >
              <input
                type="text"
                value={variant.size}
                onChange={(e) => update(variant.id, { size: e.target.value })}
                placeholder="e.g. 250 g"
                aria-label="Package size"
                className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-2 text-sm focus:border-spice-400 focus:outline-none focus:ring-2 focus:ring-spice-400/30"
              />
              <input
                type="number"
                min={0}
                step="0.01"
                value={variant.price === 0 ? "" : variant.price}
                onChange={(e) => update(variant.id, { price: Number(e.target.value) || 0 })}
                placeholder="0.00"
                aria-label="Selling price"
                className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-2 text-sm focus:border-spice-400 focus:outline-none focus:ring-2 focus:ring-spice-400/30"
              />
              <input
                type="text"
                value={variant.sku ?? ""}
                onChange={(e) => update(variant.id, { sku: e.target.value })}
                placeholder="Optional"
                aria-label="SKU"
                className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-2 text-sm focus:border-spice-400 focus:outline-none focus:ring-2 focus:ring-spice-400/30"
              />
              <div className="col-span-2 flex justify-end gap-1 sm:col-span-1">
                <button
                  type="button"
                  onClick={() => move(idx, -1)}
                  disabled={idx === 0}
                  aria-label="Move up"
                  className="rounded-lg p-2 text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--border))]/60 disabled:opacity-30"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(idx, 1)}
                  disabled={idx === variants.length - 1}
                  aria-label="Move down"
                  className="rounded-lg p-2 text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--border))]/60 disabled:opacity-30"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(variant.id)}
                  aria-label="Delete variant"
                  className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
