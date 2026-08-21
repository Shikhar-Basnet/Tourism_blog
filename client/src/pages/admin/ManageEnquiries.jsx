import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, Phone, Trash2, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { fetchContacts, updateContactStatus, deleteContactEnquiry } from "../../services/contactService.js";
import { useDebounce } from "../../hooks/useDebounce.js";
import Pagination from "../../components/Pagination.jsx";

const LIMIT = 10;
const STATUS_STYLES = {
  new: "bg-blue-50 text-blue-700",
  in_progress: "bg-amber-50 text-amber-700",
  resolved: "bg-emerald-50 text-emerald-700",
};

export default function ManageEnquiries() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [banner, setBanner] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const debouncedSearch = useDebounce(search, 400);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "contacts", { page, status, search: debouncedSearch }],
    queryFn: () => fetchContacts({ page, limit: LIMIT, status: status || undefined, search: debouncedSearch || undefined }),
  });

  const showBanner = (type, message) => {
    setBanner({ type, message });
    window.setTimeout(() => setBanner(null), 4000);
  };

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateContactStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "contacts"] });
      showBanner("success", "Status updated.");
    },
    onError: (err) => showBanner("error", err?.response?.data?.message || "Couldn't update status."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteContactEnquiry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "contacts"] });
      setPendingDeleteId(null);
      showBanner("success", "Enquiry deleted.");
    },
    onError: (err) => {
      showBanner("error", err?.response?.data?.message || "Couldn't delete enquiry.");
      setPendingDeleteId(null);
    },
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-normal text-gray-900">Enquiries</h1>
        <div className="flex items-center gap-3">
          <input
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value); }}
            placeholder="Search name, email, subject..."
            className="rounded border border-gray-300 px-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={status}
            onChange={(e) => { setPage(1); setStatus(e.target.value); }}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All statuses</option>
            <option value="new">New</option>
            <option value="in_progress">In progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {banner && (
        <div className={`mb-4 flex items-center gap-2 rounded px-3.5 py-2.5 text-sm ${banner.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
          {banner.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {banner.message}
        </div>
      )}

      <div className="rounded-2xl bg-white p-6 shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)]">
        {isLoading && <p className="text-sm text-gray-600">Loading enquiries...</p>}
        {isError && <p className="text-sm text-red-600">Couldn't load enquiries.</p>}

        {data?.data?.length > 0 && (
          <div className="divide-y divide-gray-100">
            {data.data.map((c) => (
              <div key={c._id} className="py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">{c.subject}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
                      <span>{c.name}</span>
                      <span className="flex items-center gap-1"><Mail size={11} /> {c.email}</span>
                      {c.phone && <span className="flex items-center gap-1"><Phone size={11} /> {c.phone}</span>}
                      <span className="flex items-center gap-1"><Clock size={11} /> {new Date(c.createdAt).toLocaleString()}</span>
                    </p>
                    <p className="mt-2 text-sm text-gray-700">{c.message}</p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <select
                      value={c.status}
                      disabled={statusMutation.isPending}
                      onChange={(e) => statusMutation.mutate({ id: c._id, status: e.target.value })}
                      className={`rounded border-0 px-2.5 py-1.5 text-xs font-medium disabled:opacity-50 ${STATUS_STYLES[c.status]}`}
                    >
                      <option value="new">New</option>
                      <option value="in_progress">In progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                    <button
                      onClick={() => setPendingDeleteId(c._id)}
                      className="flex items-center gap-1 rounded border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {data && data.data.length === 0 && (
          <p className="py-6 text-center text-sm text-gray-600">No enquiries yet.</p>
        )}

        {data && <Pagination page={data.page} pages={data.pages} onPageChange={setPage} />}
      </div>

      {pendingDeleteId && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-md bg-white p-6 shadow-lg">
            <h3 className="text-lg font-medium text-gray-900">Delete enquiry?</h3>
            <p className="mt-2 text-sm text-gray-600">This action cannot be undone.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setPendingDeleteId(null)} disabled={deleteMutation.isPending} className="rounded px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50">
                Cancel
              </button>
              <button onClick={() => deleteMutation.mutate(pendingDeleteId)} disabled={deleteMutation.isPending} className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60">
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}