"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, X, AlertCircle, CheckCircle2, Mail, RefreshCcw, AlertTriangle } from "lucide-react";
import { createUser, updateUser, deleteUser, resendCredentials } from "@/app/admin/users/actions";
import type { AdminUser } from "@/lib/admin-api";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/admin-permissions";

// ── Constants ─────────────────────────────────────────────────────────────────

// Roles available for assignment via this UI (subset of ALL_ROLES).
const ROLES = ["super_admin", "admin", "editor", "order_manager"] as const;

function formatDate(dt: string | null): string {
  if (!dt) return "Never";
  try {
    return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(dt));
  } catch {
    return dt;
  }
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const inputCls =
  "h-10 w-full rounded-xl border border-black/[0.09] bg-white px-3.5 text-[0.875rem] text-[#1a1a1a] outline-none placeholder:text-[#aaa] transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/10";

// ── Component ─────────────────────────────────────────────────────────────────

type ModalMode = "create" | "edit";

export default function UsersManager({ users: initialUsers }: { users: AdminUser[] }) {
  const [users, setUsers] = useState(initialUsers);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [, startTransition] = useTransition();

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("editor");

  // Create success notice
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  // Email-not-sent warning after create
  const [emailNotSentId, setEmailNotSentId] = useState<number | null>(null);
  const [resendingCreds, setResendingCreds] = useState(false);
  const [resendCredsDone, setResendCredsDone] = useState(false);
  const [resendCredsError, setResendCredsError] = useState<string | null>(null);

  // Delete
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Modal helpers ────────────────────────────────────────────────────────────

  const openCreate = () => {
    setName(""); setEmail(""); setRole("editor");
    setFormError(null); setModalMode("create"); setEditingUser(null); setModalOpen(true);
  };

  const openEdit = (user: AdminUser) => {
    setName(user.name); setEmail(user.email); setRole(user.role);
    setFormError(null); setModalMode("edit"); setEditingUser(user); setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setFormError(null); };

  // ── Submit ───────────────────────────────────────────────────────────────────

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setFormError("Name and email are required.");
      return;
    }
    setFormError(null);
    setSaving(true);

    const createdEmail = email.trim();

    startTransition(async () => {
      if (modalMode === "create") {
        const res = await createUser({ name: name.trim(), email: createdEmail, role });
        if (res.error) { setFormError(res.error); setSaving(false); return; }
        const newId = res.id ?? Date.now();
        setUsers((prev) => [
          ...prev,
          { id: newId, name: name.trim(), email: createdEmail, role, last_login_at: null },
        ]);
        setSaving(false);
        closeModal();
        if (res.email_sent === false) {
          setEmailNotSentId(newId);
          setResendCredsDone(false);
          setResendCredsError(null);
        } else {
          setCreateSuccess(createdEmail);
          setTimeout(() => setCreateSuccess(null), 6000);
        }
      } else if (editingUser) {
        const res = await updateUser(editingUser.id, {
          name: name.trim(),
          email: email.trim(),
          role,
        });
        if (res.error) { setFormError(res.error); setSaving(false); return; }
        setUsers((prev) =>
          prev.map((u) =>
            u.id === editingUser.id
              ? { ...u, name: name.trim(), email: email.trim(), role }
              : u
          )
        );
        setSaving(false);
        closeModal();
      }
    });
  };

  // ── Resend credentials ───────────────────────────────────────────────────────

  const handleResendCredentials = (id: number) => {
    setResendingCreds(true);
    setResendCredsError(null);
    startTransition(async () => {
      const res = await resendCredentials(id);
      setResendingCreds(false);
      if (res.error) { setResendCredsError(res.error); return; }
      setResendCredsDone(true);
      setTimeout(() => setEmailNotSentId(null), 4000);
    });
  };

  // ── Delete ───────────────────────────────────────────────────────────────────

  const handleDelete = (id: number) => {
    setDeleteError(null);
    setDeleting(true);
    startTransition(async () => {
      const res = await deleteUser(id);
      setDeleting(false);
      if (res.error) { setDeleteError(res.error); return; }
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setDeleteId(null);
    });
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[#E85C1A]">
            Admin Users
          </p>
          <p className="mt-0.5 text-[0.875rem] text-[#5c5e62]">
            {users.length} user{users.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-full bg-[#E85C1A] px-4 py-2 text-[0.83rem] font-semibold text-white transition hover:bg-[#d44f12]"
        >
          <Plus size={14} />
          Add User
        </button>
      </div>

      {createSuccess && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[0.83rem] text-emerald-700">
          <CheckCircle2 size={13} className="shrink-0" />
          User created. Login details sent to <strong>{createSuccess}</strong>.
        </div>
      )}

      {emailNotSentId !== null && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[0.83rem]">
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-600" />
            <div className="flex-1">
              <p className="font-semibold text-amber-800">
                User created but the welcome email could not be delivered.
              </p>
              <p className="mt-0.5 text-amber-700">
                Use &ldquo;Resend Credentials&rdquo; to retry sending login details.
              </p>
              {resendCredsError && (
                <p className="mt-1 text-[0.78rem] text-red-600">{resendCredsError}</p>
              )}
              {resendCredsDone ? (
                <div className="mt-2 flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle2 size={13} /> Credentials resent successfully.
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleResendCredentials(emailNotSentId)}
                  disabled={resendingCreds}
                  className="mt-2.5 flex items-center gap-1.5 rounded-full bg-amber-600 px-3.5 py-1.5 text-[0.78rem] font-semibold text-white transition hover:bg-amber-700 disabled:opacity-60"
                >
                  <RefreshCcw size={12} className={resendingCreds ? "animate-spin" : ""} />
                  {resendingCreds ? "Sending…" : "Resend Credentials"}
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setEmailNotSentId(null)}
              className="shrink-0 text-amber-500 transition hover:text-amber-700"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}

      {deleteError && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[0.83rem] text-red-700">
          <span>{deleteError}</span>
          <button type="button" onClick={() => setDeleteError(null)}><X size={13} /></button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-black/[0.06]">
                {["Name", "Email", "Role", "Last Login", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-[#5c5e62]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-[0.875rem] text-[#5c5e62]">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-black/[0.04] last:border-0 transition-colors hover:bg-[#f9f9f9]"
                  >
                    {/* Name */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E85C1A] text-[0.65rem] font-extrabold text-white">
                          {initials(user.name)}
                        </div>
                        <span className="text-[0.875rem] font-medium text-[#1a1a1a]">
                          {user.name}
                        </span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-5 py-3.5 text-[0.875rem] text-[#5c5e62]">
                      {user.email}
                    </td>

                    {/* Role */}
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.72rem] font-semibold ${
                          ROLE_COLORS[user.role] ?? "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {user.role_label ?? ROLE_LABELS[user.role] ?? user.role}
                      </span>
                    </td>

                    {/* Last login */}
                    <td className="px-5 py-3.5 text-[0.875rem] text-[#5c5e62]">
                      {formatDate(user.last_login_at)}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      {deleteId === user.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[0.78rem] text-[#5c5e62]">Delete?</span>
                          <button
                            type="button"
                            disabled={deleting}
                            onClick={() => handleDelete(user.id)}
                            className="rounded-lg bg-red-500 px-2.5 py-1 text-[0.72rem] font-semibold text-white transition hover:bg-red-600 disabled:opacity-60"
                          >
                            {deleting ? "…" : "Yes"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteId(null)}
                            className="rounded-lg border border-black/10 px-2.5 py-1 text-[0.72rem] font-semibold text-[#5c5e62] transition hover:bg-[#f0f2f5]"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEdit(user)}
                            title="Edit user"
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-black/[0.09] text-[#5c5e62] transition hover:border-[#E85C1A] hover:text-[#E85C1A]"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => { setDeleteError(null); setDeleteId(user.id); }}
                            title="Delete user"
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-black/[0.09] text-[#5c5e62] transition hover:border-red-400 hover:text-red-500"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Create / Edit modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            role="presentation"
            className="absolute inset-0 bg-black/50"
            onClick={closeModal}
          />

          {/* Panel */}
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[0.95rem] font-extrabold text-[#1a1a1a]">
                {modalMode === "create" ? "Add New User" : "Edit User"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[#5c5e62] transition hover:bg-[#f0f2f5]"
              >
                <X size={15} />
              </button>
            </div>

            {formError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[0.83rem] text-red-700">
                <AlertCircle size={13} className="shrink-0" />
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="mb-1.5 block text-[0.78rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  className={inputCls}
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="mb-1.5 block text-[0.78rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className={inputCls}
                  required
                />
              </div>

              {/* Role */}
              <div>
                <label className="mb-1.5 block text-[0.78rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className={`${inputCls} cursor-pointer`}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Password notice (create) */}
              {modalMode === "create" && (
                <div className="flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-[0.82rem] text-blue-800">
                  <Mail size={14} className="mt-0.5 shrink-0 text-blue-500" />
                  <span>A temporary password will be sent to the user&apos;s email address.</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="h-9 flex-1 rounded-full bg-[#E85C1A] text-[0.83rem] font-semibold text-white transition hover:bg-[#d44f12] disabled:opacity-60"
                >
                  {saving
                    ? "Saving…"
                    : modalMode === "create"
                    ? "Create User"
                    : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="h-9 rounded-full border border-black/10 px-5 text-[0.83rem] font-semibold text-[#1a1a1a] transition hover:bg-[#f0f2f5]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
