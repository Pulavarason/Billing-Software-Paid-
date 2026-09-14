"use client";

import { useEffect, useState, FormEvent } from "react";
import { X } from "lucide-react";
import { Product, ProductStatus, Variant } from "@/lib/types";
import { generateId } from "@/lib/id";
import VariantEditor from "@/components/VariantEditor";

interface ProductFormProps {
  open: boolean;
  initialProduct?: Product | null;
  onClose: () => void;
  onSave: (product: Product) => void;
}

function emptyVariant(): Variant {
  return { id: generateId("var"), size: "", price: 0, sku: "" };
}

export default function ProductForm({
  open,
  initialProduct,
  onClose,
  onSave
}: ProductFormProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProductStatus>("active");
  const [variants, setVariants] = useState<Variant[]>([emptyVariant()]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    if (initialProduct) {
      setName(initialProduct.name);
      setCategory(initialProduct.category ?? "");
      setDescription(initialProduct.description ?? "");
      setStatus(initialProduct.status);
      setVariants(initialProduct.variants.length ? initialProduct.variants : [emptyVariant()]);
    } else {
      setName("");
      setCategory("");
      setDescription("");
      setStatus("active");
      setVariants([emptyVariant()]);
    }
    setErrors({});
  }, [open, initialProduct]);

  if (!open) return null;

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = "Product name is required.";

    const cleanVariants = variants.filter((v) => v.size.trim() !== "" || v.price > 0);
    if (cleanVariants.length === 0) {
      nextErrors.variants = "Add at least one package variant.";
    } else {
      const emptySize = cleanVariants.some((v) => !v.size.trim());
      const invalidPrice = cleanVariants.some((v) => !(v.price > 0));
      if (emptySize) nextErrors.variants = "Every variant needs a package size.";
      else if (invalidPrice) nextErrors.variants = "Every variant needs a price greater than 0.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const cleanVariants = variants.filter((v) => v.size.trim() !== "");
    const now = new Date().toISOString();

    const product: Product = {
      id: initialProduct?.id ?? generateId("prod"),
      name: name.trim(),
      category: category.trim() || undefined,
      description: description.trim() || undefined,
      status,
      variants: cleanVariants,
      createdAt: initialProduct?.createdAt ?? now,
      updatedAt: now
    };

    onSave(product);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-form-title"
      className="fixed inset-0 z-[85] flex items-end justify-center bg-black/40 animate-fade-in sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-card animate-scale-in sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-[rgb(var(--border))] px-5 py-4">
          <h2 id="product-form-title" className="text-base font-semibold text-[rgb(var(--text))]">
            {initialProduct ? "Edit Product" : "Add Product"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--border))]/60"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="product-name" className="mb-1.5 block text-sm font-medium text-[rgb(var(--text))]">
                Product Name
              </label>
              <input
                id="product-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Chilli Powder"
                className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3.5 py-2.5 text-sm focus:border-spice-400 focus:outline-none focus:ring-2 focus:ring-spice-400/30"
              />
              {errors.name && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="product-category" className="mb-1.5 block text-sm font-medium text-[rgb(var(--text))]">
                Category <span className="font-normal text-[rgb(var(--text-muted))]">(optional)</span>
              </label>
              <input
                id="product-category"
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Masala Powders"
                className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3.5 py-2.5 text-sm focus:border-spice-400 focus:outline-none focus:ring-2 focus:ring-spice-400/30"
              />
            </div>

            <div>
              <label htmlFor="product-status" className="mb-1.5 block text-sm font-medium text-[rgb(var(--text))]">
                Status
              </label>
              <select
                id="product-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ProductStatus)}
                className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3.5 py-2.5 text-sm focus:border-spice-400 focus:outline-none focus:ring-2 focus:ring-spice-400/30"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="product-desc" className="mb-1.5 block text-sm font-medium text-[rgb(var(--text))]">
                Description <span className="font-normal text-[rgb(var(--text-muted))]">(optional)</span>
              </label>
              <textarea
                id="product-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Notes about this product"
                className="w-full resize-none rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3.5 py-2.5 text-sm focus:border-spice-400 focus:outline-none focus:ring-2 focus:ring-spice-400/30"
              />
            </div>
          </div>

          <div className="mt-5">
            <VariantEditor variants={variants} onChange={setVariants} error={errors.variants} />
          </div>

          <div className="mt-6 flex justify-end gap-2 border-t border-[rgb(var(--border))] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-[rgb(var(--text))] hover:bg-[rgb(var(--border))]/60"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-spice-600 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-spice-700"
            >
              {initialProduct ? "Update Product" : "Save Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
