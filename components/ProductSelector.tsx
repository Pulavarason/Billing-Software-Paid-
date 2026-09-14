"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { Minus, Plus, PlusCircle, Search } from "lucide-react";
import { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

interface ProductSelectorProps {
  products: Product[];
  onAdd: (payload: {
    productId: string;
    productName: string;
    variantId: string;
    variantSize: string;
    sku?: string;
    price: number;
    quantity: number;
  }) => void;
}

export default function ProductSelector({ products, onAdd }: ProductSelectorProps) {
  const [query, setQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products.slice(0, 8);
    return products.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 8);
  }, [products, query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedVariant = selectedProduct?.variants.find((v) => v.id === selectedVariantId);

  const chooseProduct = (product: Product) => {
    setSelectedProduct(product);
    setSelectedVariantId(product.variants[0]?.id ?? "");
    setQuery(product.name);
    setDropdownOpen(false);
    setQuantity(1);
  };

  const clearSelection = () => {
    setSelectedProduct(null);
    setSelectedVariantId("");
    setQuery("");
  };

  const handleAdd = () => {
    if (!selectedProduct || !selectedVariant || quantity < 1) return;
    onAdd({
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      variantId: selectedVariant.id,
      variantSize: selectedVariant.size,
      sku: selectedVariant.sku,
      price: selectedVariant.price,
      quantity
    });
    clearSelection();
    setQuantity(1);
  };

  return (
    <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 shadow-soft sm:p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1.4fr_1fr]">
        {/* Product search */}
        <div ref={containerRef} className="relative">
          <label htmlFor="product-search" className="mb-1.5 block text-sm font-medium text-[rgb(var(--text))]">
            Select Product
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--text-muted))]" />
            <input
              id="product-search"
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedProduct(null);
                setSelectedVariantId("");
                setDropdownOpen(true);
              }}
              onFocus={() => setDropdownOpen(true)}
              placeholder="Search product, e.g. chilli"
              autoComplete="off"
              className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] py-2.5 pl-9 pr-3 text-sm focus:border-spice-400 focus:outline-none focus:ring-2 focus:ring-spice-400/30"
            />
          </div>

          {dropdownOpen && (
            <div className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-card">
              {matches.length === 0 ? (
                <p className="px-4 py-3 text-sm text-[rgb(var(--text-muted))]">
                  No active products match &ldquo;{query}&rdquo;.
                </p>
              ) : (
                <ul className="max-h-64 overflow-y-auto py-1">
                  {matches.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => chooseProduct(p)}
                        className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-spice-50 dark:hover:bg-spice-900/20"
                      >
                        <span className="font-medium text-[rgb(var(--text))]">{p.name}</span>
                        <span className="text-xs text-[rgb(var(--text-muted))]">
                          {p.variants.length} size{p.variants.length !== 1 ? "s" : ""}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Variant select */}
        <div>
          <label htmlFor="variant-select" className="mb-1.5 block text-sm font-medium text-[rgb(var(--text))]">
            Select Package Size
          </label>
          <select
            id="variant-select"
            value={selectedVariantId}
            onChange={(e) => setSelectedVariantId(e.target.value)}
            disabled={!selectedProduct}
            className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3.5 py-2.5 text-sm focus:border-spice-400 focus:outline-none focus:ring-2 focus:ring-spice-400/30 disabled:opacity-50"
          >
            {!selectedProduct && <option value="">Select a product first</option>}
            {selectedProduct?.variants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.size}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 items-end gap-4 sm:grid-cols-[1fr_1fr_auto]">
        <div>
          <p className="mb-1.5 text-sm font-medium text-[rgb(var(--text))]">Price</p>
          <p className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--border))]/20 px-3.5 py-2.5 text-sm font-semibold text-[rgb(var(--text))]">
            {selectedVariant ? formatCurrency(selectedVariant.price) : "\u2014"}
          </p>
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium text-[rgb(var(--text))]">Quantity</p>
          <div className="flex items-center rounded-xl border border-[rgb(var(--border))]">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Decrease quantity"
              className="flex h-10 w-10 shrink-0 items-center justify-center text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))]"
            >
              <Minus className="h-4 w-4" />
            </button>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
              aria-label="Quantity"
              className="h-10 w-full min-w-0 border-x border-[rgb(var(--border))] bg-transparent text-center text-sm font-medium focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              aria-label="Increase quantity"
              className="flex h-10 w-10 shrink-0 items-center justify-center text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))]"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={!selectedVariant}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-spice-600 px-4 text-sm font-semibold text-white shadow-soft transition hover:bg-spice-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <PlusCircle className="h-4 w-4" /> Add to Bill
        </button>
      </div>
    </div>
  );
}
