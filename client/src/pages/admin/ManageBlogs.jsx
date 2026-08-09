import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Plus, X, CheckCircle2, AlertCircle, Eye } from "lucide-react";
import {
    fetchBlogsAdmin,
    createBlog,
    updateBlog,
    deleteBlog,
} from "../../services/blogService.js";
import { fetchCategories } from "../../services/categoryService.js";
import Pagination from "../../components/Pagination.jsx";

const LIMIT = 8;

const emptyForm = {
    title: "",
    excerpt: "",
    content: "",
    featuredImage: "",
    category: "",
    tags: "",
    status: "draft",
};

function BlogFormModal({ blog, categories, onClose, onSaved }) {
    const isEditing = !!blog;
    const [fields, setFields] = useState(() =>
        isEditing
            ? {
                title: blog.title || "",
                excerpt: blog.excerpt || "",
                content: blog.content || "",
                featuredImage: blog.featuredImage || "",
                category: blog.category?._id || "",
                tags: (blog.tags || []).join(", "),
                status: blog.status || "draft",
            }
            : emptyForm
    );

    const handleChange = (key) => (e) => setFields((f) => ({ ...f, [key]: e.target.value }));
    const [existingImage, setExistingImage] = useState(blog?.featuredImage || null);
    const [removeImage, setRemoveImage] = useState(false);
    const [newFile, setNewFile] = useState(null);
    const [fileError, setFileError] = useState("");

    const handleNewFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const allowed = ["image/jpeg", "image/png", "image/webp"];
        if (!allowed.includes(file.type)) {
            setFileError("Only JPG, PNG, or WEBP images are allowed.");
            return;
        }
        setFileError("");
        setNewFile(file);
        e.target.value = "";
    };

    const mutation = useMutation({
        mutationFn: () => {
            const payload = {
                title: fields.title,
                excerpt: fields.excerpt,
                content: fields.content,
                category: fields.category || undefined,
                tags: fields.tags ? fields.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
                status: fields.status,
            };
            return isEditing
                ? updateBlog(blog._id, payload, newFile, removeImage)
                : createBlog(payload, newFile);
        },
        onSuccess: (savedBlog) => {
            onSaved(isEditing ? "Blog updated." : "Blog created.", savedBlog);
            onClose();
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        mutation.mutate();
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 px-4 py-8">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-medium text-gray-900">{isEditing ? "Edit blog post" : "Add blog post"}</h2>
                    <button onClick={onClose} className="rounded p-1.5 text-gray-400 hover:bg-gray-100">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">Title</label>
                        <input value={fields.title} onChange={handleChange("title")} required
                            className="w-full rounded border border-gray-300 px-3 py-2 text-sm" />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">Excerpt</label>
                        <textarea value={fields.excerpt} onChange={handleChange("excerpt")} rows={2} maxLength={300}
                            className="w-full resize-none rounded border border-gray-300 px-3 py-2 text-sm" />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">Content</label>
                        <textarea value={fields.content} onChange={handleChange("content")} rows={8} required
                            className="w-full resize-none rounded border border-gray-300 px-3 py-2 text-sm" />
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-medium text-gray-600">Featured image</label>

                        {existingImage && !removeImage && !newFile && (
                            <div className="group relative mb-3 aspect-video w-48 overflow-hidden rounded bg-gray-100">
                                <img src={existingImage} alt="" className="h-full w-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => setRemoveImage(true)}
                                    className="absolute right-1 top-1 rounded bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        )}

                        {newFile && (
                            <div className="relative mb-3 aspect-video w-48 overflow-hidden rounded bg-emerald-50 ring-1 ring-emerald-200">
                                <img src={URL.createObjectURL(newFile)} alt="" className="h-full w-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => setNewFile(null)}
                                    className="absolute right-1 top-1 rounded bg-black/60 p-1 text-white"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        )}

                        {!newFile && (
                            <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                onChange={handleNewFile}
                                className="text-sm"
                            />
                        )}
                        <p className="mt-1 text-xs text-gray-500">One image only — uploading a new one replaces the current image.</p>
                        {fileError && <p className="mt-1 text-xs text-amber-600">{fileError}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600">Category</label>
                            <select value={fields.category} onChange={handleChange("category")}
                                className="w-full rounded border border-gray-300 px-3 py-2 text-sm">
                                <option value="">None</option>
                                {categories?.map((c) => (
                                    <option key={c._id} value={c._id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600">Status</label>
                            <select value={fields.status} onChange={handleChange("status")}
                                className="w-full rounded border border-gray-300 px-3 py-2 text-sm">
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">Tags (comma separated)</label>
                        <input value={fields.tags} onChange={handleChange("tags")} placeholder="trekking, everest"
                            className="w-full rounded border border-gray-300 px-3 py-2 text-sm" />
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
                            {mutation.isPending ? "Saving..." : isEditing ? "Save changes" : "Create blog"}
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

export default function ManageBlogs() {
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState("");
    const [editingTarget, setEditingTarget] = useState(null);
    const [pendingDeleteId, setPendingDeleteId] = useState(null);
    const [banner, setBanner] = useState(null);
    const queryClient = useQueryClient();

    const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });

    const { data, isLoading, isError } = useQuery({
        queryKey: ["blogs", "admin", { page, status: statusFilter }],
        queryFn: () => fetchBlogsAdmin({ page, limit: LIMIT, status: statusFilter || undefined }),
    });

    const showBanner = (type, message) => {
        setBanner({ type, message });
        window.setTimeout(() => setBanner(null), 4000);
    };

    const invalidateAndNotify = (message) => {
        queryClient.invalidateQueries({ queryKey: ["blogs"] });
        showBanner("success", message);
    };

    const deleteMutation = useMutation({
        mutationFn: (id) => deleteBlog(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["blogs"] });
            setPendingDeleteId(null);
            showBanner("success", "Blog deleted.");
        },
        onError: (err) => {
            showBanner("error", err?.response?.data?.message || "Couldn't delete blog.");
            setPendingDeleteId(null);
        },
    });

    return (
        <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-2xl font-normal text-gray-900">Blogs</h1>
                <div className="flex items-center gap-3">
                    <select
                        value={statusFilter}
                        onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}
                        className="rounded border border-gray-300 px-3 py-1.5 text-sm"
                    >
                        <option value="">All statuses</option>
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                    </select>
                    <button
                        onClick={() => setEditingTarget({})}
                        className="flex items-center gap-1.5 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                        <Plus size={15} /> Add blog
                    </button>
                </div>
            </div>

            {banner && (
                <div
                    className={`mb-4 flex items-center gap-2 rounded px-3.5 py-2.5 text-sm ${banner.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                        }`}
                >
                    {banner.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    {banner.message}
                </div>
            )}

            <div className="rounded-2xl bg-white p-6 shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)]">
                {isLoading && <p className="text-sm text-gray-600">Loading blogs...</p>}
                {isError && <p className="text-sm text-red-600">Couldn't load blogs.</p>}

                {data?.data?.length > 0 && (
                    <div className="divide-y divide-gray-100">
                        {data.data.map((blog) => (
                            <div key={blog._id} className="flex items-center gap-4 py-3">
                                <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded bg-gray-100">
                                    {blog.featuredImage ? (
                                        <img src={blog.featuredImage} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-500">No image</div>
                                    )}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-gray-900">{blog.title}</p>
                                    <p className="truncate text-xs text-gray-600">
                                        {blog.category?.name || "Uncategorized"} ·{" "}
                                        <span className={blog.status === "published" ? "text-emerald-600" : "text-amber-600"}>
                                            {blog.status}
                                        </span>
                                        {" · "}
                                        <span className="inline-flex items-center gap-1"><Eye size={11} /> {blog.views}</span>
                                    </p>
                                </div>

                                <div className="flex flex-shrink-0 items-center gap-2">
                                    <button
                                        onClick={() => setEditingTarget(blog)}
                                        className="flex items-center gap-1 rounded border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        <Pencil size={13} /> Edit
                                    </button>
                                    <button
                                        onClick={() => setPendingDeleteId(blog._id)}
                                        className="flex items-center gap-1 rounded border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 size={13} /> Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {data && data.data.length === 0 && (
                    <p className="py-6 text-center text-sm text-gray-600">No blog posts yet.</p>
                )}

                {data && <Pagination page={data.page} pages={data.pages} onPageChange={setPage} />}
            </div>

            {editingTarget !== null && (
                <BlogFormModal
                    blog={editingTarget._id ? editingTarget : null}
                    categories={categories}
                    onClose={() => setEditingTarget(null)}
                    onSaved={invalidateAndNotify}
                />
            )}

            {pendingDeleteId && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 px-4">
                    <div className="w-full max-w-sm rounded-md bg-white p-6 shadow-lg">
                        <h3 className="text-lg font-medium text-gray-900">Delete blog post?</h3>
                        <p className="mt-2 text-sm text-gray-600">This action cannot be undone.</p>
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