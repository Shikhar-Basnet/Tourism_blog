import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Plus, X, CheckCircle2, AlertCircle } from "lucide-react";
import {
    fetchDestinations,
    createDestination,
    updateDestination,
    deleteDestination,
} from "../../services/destinationService.js";
import Pagination from "../../components/Pagination.jsx";

const LIMIT = 8;

const emptyForm = {
    title: "",
    description: "",
    province: "",
    district: "",
    bestTimeToVisit: "",
    altitude: "",
    "coordinates.lat": "",
    "coordinates.lng": "",
};

function DestinationFormModal({ destination, onClose, onSaved }) {
    const isEditing = !!destination;
    const queryClient = useQueryClient();

    const [fields, setFields] = useState(() =>
        isEditing
            ? {
                title: destination.title || "",
                description: destination.description || "",
                province: destination.province || "",
                district: destination.district || "",
                bestTimeToVisit: destination.bestTimeToVisit || "",
                altitude: destination.altitude ?? "",
                "coordinates.lat": destination.coordinates?.lat ?? "",
                "coordinates.lng": destination.coordinates?.lng ?? "",
            }
            : emptyForm
    );
    const [existingImages, setExistingImages] = useState(destination?.gallery || []);
    const [removedImages, setRemovedImages] = useState([]);
    const [newFiles, setNewFiles] = useState([]);
    const [fileError, setFileError] = useState("");

    const handleChange = (key) => (e) => setFields((f) => ({ ...f, [key]: e.target.value }));

    const handleNewFiles = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const allowed = ["image/jpeg", "image/png", "image/webp"];
        const rejected = files.filter((f) => !allowed.includes(f.type));
        if (rejected.length > 0) {
            setFileError(`Skipped ${rejected.length} file(s): only JPG, PNG, or WEBP images are allowed.`);
        } else {
            setFileError("");
        }

        const accepted = files.filter((f) => allowed.includes(f.type));
        setNewFiles((prev) => [...prev, ...accepted]);
        e.target.value = ""; // allow re-selecting the same file if removed
    };

    const markForRemoval = (url) => {
        setExistingImages((prev) => prev.filter((u) => u !== url));
        setRemovedImages((prev) => [...prev, url]);
    };

    const removeNewFile = (index) => {
        setNewFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const mutation = useMutation({
        mutationFn: () => {
            const payload = {
                title: fields.title,
                description: fields.description,
                province: fields.province,
                district: fields.district,
                bestTimeToVisit: fields.bestTimeToVisit,
                altitude: fields.altitude === "" ? undefined : Number(fields.altitude),
                coordinates: {
                    lat: Number(fields["coordinates.lat"]),
                    lng: Number(fields["coordinates.lng"]),
                },
            };
            return isEditing
                ? updateDestination(destination._id, payload, newFiles, removedImages)
                : createDestination(payload, newFiles);
        },
        onSuccess: (savedDestination) => {
            queryClient.invalidateQueries({ queryKey: ["destinations"] });
            if (savedDestination?.slug) {
                queryClient.invalidateQueries({ queryKey: ["destination", savedDestination.slug] });
            }
            onSaved(isEditing ? "Destination updated." : "Destination created.");
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
                    <h2 className="text-lg font-medium text-gray-900">
                        {isEditing ? "Edit destination" : "Add destination"}
                    </h2>
                    <button onClick={onClose} className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                            <label className="mb-1 block text-xs font-medium text-gray-600">Title</label>
                            <input value={fields.title} onChange={handleChange("title")} required
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                        </div>
                        <div className="col-span-2">
                            <label className="mb-1 block text-xs font-medium text-gray-600">Description</label>
                            <textarea value={fields.description} onChange={handleChange("description")} rows={3} required
                                className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600">Province</label>
                            <input value={fields.province} onChange={handleChange("province")} required
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600">District</label>
                            <input value={fields.district} onChange={handleChange("district")}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600">Best time to visit</label>
                            <input value={fields.bestTimeToVisit} onChange={handleChange("bestTimeToVisit")}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600">Altitude (m)</label>
                            <input type="number" value={fields.altitude} onChange={handleChange("altitude")}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600">Latitude</label>
                            <input type="number" step="any" value={fields["coordinates.lat"]} onChange={handleChange("coordinates.lat")} required
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600">Longitude</label>
                            <input type="number" step="any" value={fields["coordinates.lng"]} onChange={handleChange("coordinates.lng")} required
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-medium text-gray-600">
                            Images {newFiles.length > 0 && `(${newFiles.length} new selected)`}
                        </label>

                        {existingImages.length > 0 && (
                            <div className="mb-3 grid grid-cols-4 gap-2">
                                {existingImages.map((url) => (
                                    <div key={url} className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                                        <img src={url} alt="" className="h-full w-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => markForRemoval(url)}
                                            className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                                            title="Remove image"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {newFiles.length > 0 && (
                            <div className="mb-3 grid grid-cols-4 gap-2">
                                {newFiles.map((file, i) => (
                                    <NewFilePreview key={i} file={file} onRemove={() => removeNewFile(i)} />
                                ))}
                            </div>
                        )}

                        <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            multiple
                            onChange={handleNewFiles}
                            className="text-sm"
                        />
                        <p className="mt-1 text-xs text-gray-500">First image in the list is used as the card/hero thumbnail.</p>
                        {fileError && <p className="mt-1 text-xs text-amber-600">{fileError}</p>}
                    </div>

                    <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
                        <button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={mutation.isPending}
                            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                            {mutation.isPending ? "Saving..." : isEditing ? "Save changes" : "Create destination"}
                        </button>
                    </div>

                    {mutation.isError && (
                        <p className="text-sm text-red-600">
                            {mutation.error?.response?.data?.message || mutation.error?.message || "Something went wrong."}
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
}

// Isolated so URL.createObjectURL is only ever called once per file and
// properly released — calling it inline in JSX (previous version) created
// a new blob URL on every parent re-render.
function NewFilePreview({ file, onRemove }) {
    const [url] = useState(() => URL.createObjectURL(file));

    return (
        <div className="relative aspect-square overflow-hidden rounded-lg bg-emerald-50 ring-1 ring-emerald-200">
            <img
                src={url}
                alt=""
                className="h-full w-full object-cover"
                onLoad={() => URL.revokeObjectURL(url)}
            />
            <button
                type="button"
                onClick={onRemove}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
            >
                <X size={12} />
            </button>
        </div>
    );
}

export default function ManageDestinations() {
    const [page, setPage] = useState(1);
    const [editingTarget, setEditingTarget] = useState(null); // null = closed, {} = create, {...dest} = edit
    const [pendingDeleteId, setPendingDeleteId] = useState(null);
    const [banner, setBanner] = useState(null); // { type: "success" | "error", message }
    const queryClient = useQueryClient();

    const { data, isLoading, isError } = useQuery({
        queryKey: ["destinations", { page, limit: LIMIT, admin: true }],
        queryFn: () => fetchDestinations({ page, limit: LIMIT }),
    });

    const showBanner = (type, message) => {
        setBanner({ type, message });
        window.setTimeout(() => setBanner(null), 4000);
    };

    const deleteMutation = useMutation({
        mutationFn: (id) => deleteDestination(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["destinations"] });
            setPendingDeleteId(null);
            showBanner("success", "Destination deleted.");
        },
        onError: (err) => {
            showBanner("error", err?.response?.data?.message || "Couldn't delete destination.");
        },
    });

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-normal text-gray-900">Destinations</h1>
                <button
                    onClick={() => setEditingTarget({})}
                    className="flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                    <Plus size={15} /> Add destination
                </button>
            </div>

            {banner && (
                <div
                    className={`mb-4 flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm ${banner.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                        }`}
                >
                    {banner.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    {banner.message}
                </div>
            )}

            {isLoading && <p className="text-sm text-gray-600">Loading destinations...</p>}
            {isError && <p className="text-sm text-red-600">Couldn't load destinations.</p>}

            {data?.data?.length > 0 && (
                <div className="divide-y divide-gray-100">
                    {data.data.map((dest) => (
                        <div key={dest._id} className="flex items-center gap-4 py-3">
                            <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                                {dest.gallery?.[0] ? (
                                    <img src={dest.gallery[0]} alt="" className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-500">
                                        No image
                                    </div>
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-gray-900">{dest.title}</p>
                                <p className="truncate text-xs text-gray-600">
                                    {dest.province}{dest.district ? `, ${dest.district}` : ""} · {dest.gallery?.length || 0} image{dest.gallery?.length === 1 ? "" : "s"}
                                </p>
                            </div>

                            <div className="flex flex-shrink-0 items-center gap-2">
                                <button
                                    onClick={() => setEditingTarget(dest)}
                                    className="flex items-center gap-1 rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    <Pencil size={13} /> Edit
                                </button>
                                <button
                                    onClick={() => setPendingDeleteId(dest._id)}
                                    className="flex items-center gap-1 rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                                >
                                    <Trash2 size={13} /> Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {data && data.data.length === 0 && (
                <p className="py-6 text-center text-sm text-gray-600">No destinations yet.</p>
            )}

            {data && <Pagination page={data.page} pages={data.pages} onPageChange={setPage} />}

            {editingTarget !== null && (
                <DestinationFormModal
                    destination={editingTarget._id ? editingTarget : null}
                    onClose={() => setEditingTarget(null)}
                    onSaved={(message) => showBanner("success", message)}
                />
            )}

            {pendingDeleteId && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 px-4">
                    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg">
                        <h3 className="text-lg font-medium text-gray-900">Delete destination?</h3>
                        <p className="mt-2 text-sm text-gray-600">
                            This action cannot be undone.
                        </p>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setPendingDeleteId(null)}
                                disabled={deleteMutation.isPending}
                                className="rounded-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => deleteMutation.mutate(pendingDeleteId)}
                                disabled={deleteMutation.isPending}
                                className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
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