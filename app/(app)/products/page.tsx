"use client";

import { useMemo, useState } from "react";
import { Package, Plus } from "lucide-react";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import SearchInput from "@/components/SearchInput";
import ProductTable from "@/components/ProductTable";
import ProductForm from "@/components/ProductForm";
import ConfirmDialog from "@/components/ConfirmDialog";
import EmptyState from "@/components/EmptyState";
import { Product } from "@/lib/types";

type StatusFilter = "all" | "active" | "inactive";

export default function ProductsPage() {
  const { data, isReady, addProduct, updateProduct, deleteProduct } = useData();
  const { showToast } = useToast();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    data.products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [data.products]);

  const filtered = useMemo(() => {
    return data.products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.trim().toLowerCase());
      const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [data.products, search, categoryFilter, statusFilter]);

  const openAddForm = () => {
    setEditingProduct(null);
    setFormOpen(true);
  };

  const openEditForm = (product: Product) => {
    setEditingProduct(product);
    setFormOpen(true);
  };

  const handleSave = (product: Product) => {
    if (editingProduct) {
      updateProduct(product);
      showToast(`"${product.name}" updated successfully.`);
    } else {
      addProduct(product);
      showToast(`"${product.name}" added to your catalog.`);
    }
    setFormOpen(false);
  };

  const handleDeleteConfirmed = () => {
    if (!deleteTarget) return;
    deleteProduct(deleteTarget.id);
    showToast(`"${deleteTarget.name}" deleted.`, "info");
    setDeleteTarget(null);
  };

  if (!isReady) {
    return <div className="text-sm text-[rgb(var(--text-muted))]">Loading&hellip;</div>;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search products..."
            className="sm:max-w-xs"
          />
          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter by category"
              className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3.5 py-2.5 text-sm focus:border-spice-400 focus:outline-none focus:ring-2 focus:ring-spice-400/30"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            aria-label="Filter by status"
            className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3.5 py-2.5 text-sm focus:border-spice-400 focus:outline-none focus:ring-2 focus:ring-spice-400/30"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <button
          onClick={openAddForm}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-spice-600 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-spice-700"
        >
          <Plus className="h-4 w-4" /> Add Product
        </button>
      </div>

      {data.products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products yet"
          description="Add your first masala product with its package sizes and prices to start billing."
          action={
            <button
              onClick={openAddForm}
              className="inline-flex items-center gap-2 rounded-lg bg-spice-600 px-4 py-2 text-sm font-medium text-white hover:bg-spice-700"
            >
              <Plus className="h-4 w-4" /> Add Product
            </button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No matching products"
          description="Try a different search term or filter."
        />
      ) : (
        <ProductTable products={filtered} onEdit={openEditForm} onDelete={setDeleteTarget} />
      )}

      <ProductForm
        open={formOpen}
        initialProduct={editingProduct}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This will remove the product and its variants from your catalog. Bills already created will keep their saved details."
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
