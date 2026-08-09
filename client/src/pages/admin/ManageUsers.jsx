import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, AlertCircle, ShieldCheck, Ban, RotateCcw } from "lucide-react";
import { fetchUsers, updateUserRole, toggleUserActive } from "../../services/userService.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useDebounce } from "../../hooks/useDebounce.js";
import Pagination from "../../components/Pagination.jsx";

const LIMIT = 12;
const ROLES = ["user", "editor", "admin", "superadmin"];

export default function ManageUsers() {
    const { user: currentUser } = useAuth();
    const [page, setPage] = useState(1);
    const [role, setRole] = useState("");
    const [search, setSearch] = useState("");
    const [banner, setBanner] = useState(null);
    // Holds the target user object (not just an id) while the confirm modal
    // is open, so the modal can show their name and the correct "Deactivate"
    // vs "Reactivate" wording without re-fetching anything.
    const [pendingToggleUser, setPendingToggleUser] = useState(null);
    const debouncedSearch = useDebounce(search, 400);
    const queryClient = useQueryClient();

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["admin", "users", { page, role, search: debouncedSearch }],
        queryFn: () => fetchUsers({ page, limit: LIMIT, role: role || undefined, search: debouncedSearch || undefined }),
    });

    const showBanner = (type, message) => {
        setBanner({ type, message });
        window.setTimeout(() => setBanner(null), 4000);
    };

    const roleMutation = useMutation({
        mutationFn: ({ id, role }) => updateUserRole(id, role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
            showBanner("success", "Role updated.");
        },
        onError: (err) => showBanner("error", err?.response?.data?.message || "Couldn't update role."),
    });

    const statusMutation = useMutation({
        mutationFn: (id) => toggleUserActive(id),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
            setPendingToggleUser(null);
            showBanner("success", result.isActive ? "User reactivated." : "User deactivated.");
        },
        onError: (err) => {
            showBanner("error", err?.response?.data?.message || "Couldn't update status.");
            setPendingToggleUser(null);
        },
    });

    const confirmToggleStatus = () => {
        if (!pendingToggleUser) return;
        statusMutation.mutate(pendingToggleUser._id);
    };

    const assignableRoles = currentUser?.role === "superadmin" ? ROLES : ROLES.filter((r) => r !== "superadmin");

    return (
        <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-2xl font-normal text-gray-900">Users</h1>
                <div className="flex items-center gap-3">
                    <input
                        value={search}
                        onChange={(e) => { setPage(1); setSearch(e.target.value); }}
                        placeholder="Search name or email..."
                        className="rounded-full border border-gray-300 px-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                        value={role}
                        onChange={(e) => { setPage(1); setRole(e.target.value); }}
                        className="rounded-full border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All roles</option>
                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
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

            <div className="rounded-2xl bg-white p-6 shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)]">
                {isLoading && <p className="text-sm text-gray-600">Loading users...</p>}
                {isError && (
                    <p className="text-sm text-red-600">
                        Couldn't load users: {error?.response?.data?.message || error?.message || "unknown error"}
                    </p>
                )}

                {data?.data?.length > 0 && (
                    <div className="divide-y divide-gray-100">
                        {data.data.map((u) => {
                            const isSelf = u._id === currentUser?.id;
                            const isLockedForAdmin = currentUser?.role === "admin" && u.role === "superadmin";
                            const canChangeRoles = currentUser?.role === "superadmin" ? !isSelf : !isSelf && !isLockedForAdmin;
                            return (
                                <div key={u._id} className="flex items-center gap-4 py-3">
                                    {u.avatar ? (
                                        <img src={u.avatar} alt="" referrerPolicy="no-referrer" className="h-9 w-9 flex-shrink-0 rounded-full" />
                                    ) : (
                                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-medium text-white">
                                            {u.name?.[0]?.toUpperCase()}
                                        </div>
                                    )}

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-gray-900">
                                            {u.name} {isSelf && <span className="text-xs text-gray-400">(you)</span>}
                                        </p>
                                        <p className="truncate text-xs text-gray-600">
                                            {u.email} · {u.provider}
                                            {!u.isActive && <span className="ml-1 text-red-600">· deactivated</span>}
                                        </p>
                                    </div>

                                    <div className="flex flex-shrink-0 items-center gap-2">
                                        {canChangeRoles ? (
                                            <select
                                                value={u.role}
                                                disabled={isSelf || roleMutation.isPending}
                                                onChange={(e) => roleMutation.mutate({ id: u._id, role: e.target.value })}
                                                className="rounded-full border border-gray-300 px-2.5 py-1 text-xs disabled:opacity-50"
                                            >
                                                {(assignableRoles.includes(u.role) ? assignableRoles : [...assignableRoles, u.role]).map((r) => (
                                                    <option key={r} value={r}>{r}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700">
                                                <ShieldCheck size={12} /> {u.role}
                                            </span>
                                        )}

                                        <button
                                            onClick={() => setPendingToggleUser(u)}
                                            disabled={isSelf || isLockedForAdmin || statusMutation.isPending}
                                            title={
                                                isLockedForAdmin
                                                    ? "Admins can't deactivate a superadmin's account"
                                                    : u.isActive ? "Deactivate user" : "Reactivate user"
                                            }
                                            className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium disabled:opacity-40 ${u.isActive
                                                ? "border-red-200 text-red-600 hover:bg-red-50"
                                                : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                                }`}
                                        >
                                            {u.isActive ? <Ban size={13} /> : <RotateCcw size={13} />}
                                            {u.isActive ? "Deactivate" : "Reactivate"}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {data && data.data.length === 0 && (
                    <p className="py-6 text-center text-sm text-gray-600">No users match.</p>
                )}

                {data && <Pagination page={data.page} pages={data.pages} onPageChange={setPage} />}
            </div>

            {pendingToggleUser && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 px-4">
                    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg">
                        <h3 className="text-lg font-medium text-gray-900">
                            {pendingToggleUser.isActive ? "Deactivate user?" : "Reactivate user?"}
                        </h3>
                        <p className="mt-2 text-sm text-gray-600">
                            {pendingToggleUser.isActive ? (
                                <>
                                    <span className="font-medium text-gray-900">{pendingToggleUser.name}</span>{" "}
                                    will lose access immediately and won't be able to sign back in until reactivated.
                                </>
                            ) : (
                                <>
                                    <span className="font-medium text-gray-900">{pendingToggleUser.name}</span>{" "}
                                    will be able to sign in again.
                                </>
                            )}
                        </p>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setPendingToggleUser(null)}
                                disabled={statusMutation.isPending}
                                className="rounded-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmToggleStatus}
                                disabled={statusMutation.isPending}
                                className={`rounded-full px-4 py-2 text-sm font-medium text-white disabled:opacity-60 ${
                                    pendingToggleUser.isActive
                                        ? "bg-red-600 hover:bg-red-700"
                                        : "bg-emerald-600 hover:bg-emerald-700"
                                }`}
                            >
                                {statusMutation.isPending
                                    ? (pendingToggleUser.isActive ? "Deactivating..." : "Reactivating...")
                                    : (pendingToggleUser.isActive ? "Deactivate" : "Reactivate")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}