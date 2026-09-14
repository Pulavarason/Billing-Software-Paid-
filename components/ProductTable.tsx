"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Product } from "@/lib/types";
import { formatDateDisplay, priceRange } from "@/lib/format";

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export default function ProductTable({ products, onEdit, onDelete }: ProductTableProps) {
  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-soft md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[rgb(var(--border))] bg-[rgb(var(--border))]/20 text-left text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-muted))]">
              <th className="px-5 py-3">Product Name</th>
              <th className="px-5 py-3">Variants</th>
              <th className="px-5 py-3">Price Range</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Last Updated</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgb(var(--border))]">
            {products.map((product) => (
              <tr key={product.id} className="transition hover:bg-[rgb(var(--border))]/20">
                <td className="px-5 py-3.5">
                  <p className="font-medium text-[rgb(var(--text))]">{product.name}</p>
                  {product.category && (
                    <p className="text-xs text-[rgb(var(--text-muted))]">{product.category}</p>
                  )}
                </td>
                <td className="px-5 py-3.5 text-[rgb(var(--text))]">
                  {product.variants.length} Variant{product.variants.length !== 1 ? "s" : ""}
                </td>
                <td className="px-5 py-3.5 text-[rgb(var(--text))]">
                  {priceRange(product.variants.map((v) => v.price))}
                </td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={product.status} />
                </td>
                <td className="px-5 py-3.5 text-[rgb(var(--text-muted))]">
                  {formatDateDisplay(product.updatedAt)}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => onEdit(product)}
                      aria-label={`Edit ${product.name}`}
                      className="rounded-lg p-2 text-[rgb(var(--text-muted))] hover:bg-spice-50 hover:text-spice-700 dark:hover:bg-spice-900/30 dark:hover:text-spice-400"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(product)}
                      aria-label={`Delete ${product.name}`}
                      className="rounded-lg p-2 text-[rgb(var(--text-muted))] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {products.map((product) => (
          <div
            key={product.id}
            className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 shadow-soft"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-[rgb(var(--text))]">{product.name}</p>
                {product.category && (
                  <p className="text-xs text-[rgb(var(--text-muted))]">{product.category}</p>
                )}
              </div>
              <StatusBadge status={product.status} />
            </div>
            <div className="mt-2.5 flex items-center justify-between text-sm">
              <span className="text-[rgb(var(--text-muted))]">
                {product.variants.length} Variant{product.variants.length !== 1 ? "s" : ""}
              </span>
              <span className="font-medium text-[rgb(var(--text))]">
                {priceRange(product.variants.map((v) => v.price))}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-[rgb(var(--border))] pt-3">
              <span className="text-xs text-[rgb(var(--text-muted))]">
                Updated {formatDateDisplay(product.updatedAt)}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => onEdit(product)}
                  aria-label={`Edit ${product.name}`}
                  className="rounded-lg p-2 text-[rgb(var(--text-muted))] hover:bg-spice-50 hover:text-spice-700 dark:hover:bg-spice-900/30 dark:hover:text-spice-400"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete(product)}
                  aria-label={`Delete ${product.name}`}
                  className="rounded-lg p-2 text-[rgb(var(--text-muted))] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function StatusBadge({ status }: { status: "active" | "inactive" }) {
  const active = status === "active";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
        active
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}
