import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Plus, X, CheckCircle2, AlertCircle } from "lucide-react";
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../services/categoryService.js";

function CategoryFormModal({ category, onClose, onSaved }) {
  const isEditing = !!category;
  const [name, setName] = useState(category?.name || "");
  const [description, setDescription] = useState(category?.description || "");
  const [icon, setIcon] = useState(category?.icon || "");

  const mutation = useMutation({
    mutationFn: () => {
      const payload = { name, description, icon: icon || undefined };
      return isEditing ? updateCategory(category._id, payload) : createCategory(payload);
    },
    onSuccess: () => {
      onSaved(isEditing ? "Category updated." : "Category created.");
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">
            {isEditing ? "Edit category" : "Add category"}
          </h2>
          <button onClick={onClose} className="rounded p-1.5 text-gray-400 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full resize-none rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Icon <span className="text-gray-400">(optional, lucide-react name e.g. "mountain")</span>
            </label>
            <input
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
            <button type="button" onClick={onClose} className="rounded px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {mutation.isPending ? "Saving..." : isEditing ? "Save changes" : "Create category"}
            </button>
          </div>

          {mutation.isError && (
            <p className="text-sm text-red-600">
              {mutation.error?.response?.data?.message || "Something went wrong."}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

export default function ManageCategories() {
  const [editingTarget, setEditingTarget] = useState(null); // null closed, {} create, {...cat} edit
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [banner, setBanner] = useState(null);
  const queryClient = useQueryClient();

  const { data: categories, isLoading, isError } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const showBanner = (type, message) => {
    setBanner({ type, message });
    window.setTimeout(() => setBanner(null), 4000);
  };

  const invalidateAndClose = (message) => {
    queryClient.invalidateQueries({ queryKey: ["categories"] });
    showBanner("success", message);
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setPendingDeleteId(null);
      showBanner("success", "Category deleted.");
    },
    onError: (err) => {
      showBanner("error", err?.response?.data?.message || "Couldn't delete category. It may still be in use by a blog post.");
      setPendingDeleteId(null);
    },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-normal text-gray-900">Categories</h1>
        <button
          onClick={() => setEditingTarget({})}
          className="flex items-center gap-1.5 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={15} /> Add category
        </button>
      </div>

      {banner && (
        <div
          className={`mb-4 flex items-center gap-2 rounded px-3.5 py-2.5 text-sm ${
            banner.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
          }`}
        >
          {banner.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {banner.message}
        </div>
      )}

      <div className="rounded-2xl bg-white p-6 shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)]">
        {isLoading && <p className="text-sm text-gray-600">Loading categories...</p>}
        {isError && <p className="text-sm text-red-600">Couldn't load categories.</p>}

        {categories?.length > 0 && (
          <div className="divide-y divide-gray-100">
            {categories.map((cat) => (
              <div key={cat._id} className="flex items-center gap-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{cat.name}</p>
                  <p className="truncate text-xs text-gray-600">{cat.description || "No description"}</p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  <button
                    onClick={() => setEditingTarget(cat)}
                    className="flex items-center gap-1 rounded border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Pencil size={13} /> Edit
                  </button>
                  <button
                    onClick={() => setPendingDeleteId(cat._id)}
                    className="flex items-center gap-1 rounded border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {categories && categories.length === 0 && (
          <p className="py-6 text-center text-sm text-gray-600">No categories yet.</p>
        )}
      </div>

      {editingTarget !== null && (
        <CategoryFormModal
          category={editingTarget._id ? editingTarget : null}
          onClose={() => setEditingTarget(null)}
          onSaved={invalidateAndClose}
        />
      )}

      {pendingDeleteId && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-md bg-white p-6 shadow-lg">
            <h3 className="text-lg font-medium text-gray-900">Delete category?</h3>
            <p className="mt-2 text-sm text-gray-600">
              This action cannot be undone. Blog posts using this category will keep their reference but it won't resolve.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setPendingDeleteId(null)}
                disabled={deleteMutation.isPending}
                className="rounded px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(pendingDeleteId)}
                disabled={deleteMutation.isPending}
                className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}