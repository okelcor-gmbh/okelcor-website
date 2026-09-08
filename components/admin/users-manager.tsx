"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, X, AlertCircle, CheckCircle2, Mail, RefreshCcw, AlertTriangle, KeyRound, RotateCcw } from "lucide-react";
import {
  createUser, updateUser, deleteUser, resendCredentials,
  getPermissionsCatalog, updateUserPermissions,
  type PermissionCatalogEntry,
} from "@/app/admin/users/actions";
import type { AdminUser } from "@/lib/admin-api";
import { ALL_ROLES, ROLE_LABELS, ROLE_COLORS } from "@/lib/admin-permissions";

// ── Constants ─────────────────────────────────────────────────────────────────

/**
 * Every role the system has.
 *
 * This was a four-value subset, which matched reality rather than intent: the
 * `admin_users.role` column was a MySQL ENUM that could only store those four,
 * so offering the others would have produced a save that failed. The column is
 * now a plain string validated against the backend's own ROLES list, so the
 * five it had been silently refusing — finance, sales_manager, support,
 * content_manager, viewer — can be assigned. `finance` in particular has to be
 * assignable or the finance half of order sign-off can never be given.
 *
 * Driven off ALL_ROLES so this list cannot drift from the permission map again.
 */
const ROLES = ALL_ROLES;

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
  "h-10 w-full rounded-xl border border-black/[0.09] bg-white px-3.5 text-[0.875rem] text-[#1a1a1a] outline-none placeholder:text-[#aaa] transition focus:border-[#f4511e] focus:ring-2 focus:ring-[#f4511e]/10";

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

  // Permission overrides editor
  const [permsUser, setPermsUser]       = useState<AdminUser | null>(null);
  const [catalog, setCatalog]           = useState<PermissionCatalogEntry[] | null>(null);
  const [permsChecked, setPermsChecked] = useState<Set<string>>(new Set());
  const [permsError, setPermsError]     = useState<string | null>(null);
  const [permsSaving, setPermsSaving]   = useState(false);

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

  // ── Permission overrides ─────────────────────────────────────────────────────

  /** Role-default permission keys for a role, from the loaded catalog. */
  const roleDefaults = (cat: PermissionCatalogEntry[], role: string): Set<string> =>
    new Set(cat.filter((p) => p.roles.includes(role)).map((p) => p.key));

  const openPermissions = (user: AdminUser) => {
    setPermsUser(user);
    setPermsError(null);
    setPermsChecked(new Set());

    startTransition(async () => {
      let cat = catalog;
      if (!cat) {
        const res = await getPermissionsCatalog();
        if (res.error || !res.permissions) {
          setPermsError(res.error ?? "Failed to load the permission catalog.");
          return;
        }
        cat = res.permissions;
        setCatalog(cat);
      }
      // Effective = API's list when we have it; otherwise role defaults.
      const effective = user.permissions?.length
        ? new Set(user.permissions)
        : roleDefaults(cat, user.role);
      setPermsChecked(effective);
    });
  };

  const togglePerm = (key: string) => {
    setPermsChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const resetToRole = () => {
    if (!catalog || !permsUser) return;
    setPermsChecked(roleDefaults(catalog, permsUser.role));
  };

  const savePermissions = () => {
    if (!catalog || !permsUser) return;
    const defaults = roleDefaults(catalog, permsUser.role);
    const grants   = [...permsChecked].filter((k) => !defaults.has(k));
    const revokes  = [...defaults].filter((k) => !permsChecked.has(k));

    setPermsSaving(true);
    setPermsError(null);
    startTransition(async () => {
      const res = await updateUserPermissions(permsUser.id, grants, revokes);
      setPermsSaving(false);
      if (res.error || !res.user) {
        setPermsError(res.error ?? "Failed to update permissions.");
        return;
      }
      const updated = res.user;
      setUsers((prev) =>
        prev.map((u) => (u.id === permsUser.id ? { ...u, ...updated } : u))
      );
      setPermsUser(null);
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
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[#f4511e]">
            Admin Users
          </p>
          <p className="mt-0.5 text-[0.875rem] text-[#5c5e62]">
            {users.length} user{users.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-full bg-[#f4511e] px-4 py-2 text-[0.83rem] font-semibold text-white transition hover:bg-[#df4618]"
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
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
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
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f4511e] text-[0.65rem] font-extrabold text-white">
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
                      {user.has_permission_overrides && (
                        <span
                          title="This user's access has been customized beyond their role"
                          className="ml-1.5 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[0.65rem] font-semibold text-amber-700"
                        >
                          customized
                        </span>
                      )}
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
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-black/[0.09] text-[#5c5e62] transition hover:border-[#f4511e] hover:text-[#f4511e]"
                          >
                            <Pencil size={13} />
                          </button>
                          {user.role !== "super_admin" && (
                            <button
                              type="button"
                              onClick={() => openPermissions(user)}
                              title="Edit permissions"
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-black/[0.09] text-[#5c5e62] transition hover:border-[#f4511e] hover:text-[#f4511e]"
                            >
                              <KeyRound size={13} />
                            </button>
                          )}
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
          <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
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
                  className="h-9 flex-1 rounded-full bg-[#f4511e] text-[0.83rem] font-semibold text-white transition hover:bg-[#df4618] disabled:opacity-60"
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

      {/* ── Permission overrides modal ── */}
      {permsUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            role="presentation"
            className="absolute inset-0 bg-black/50"
            onClick={() => setPermsUser(null)}
          />

          <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-xl bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-black/[0.06] px-6 py-5">
              <div>
                <h2 className="text-[0.95rem] font-extrabold text-[#1a1a1a]">
                  Permissions — {permsUser.name}
                </h2>
                <p className="mt-0.5 text-[0.78rem] text-[#5c5e62]">
                  Ticked = allowed. Unticking a role default removes it for this person only;
                  ticking something extra adds it without changing their{" "}
                  <strong>{ROLE_LABELS[permsUser.role] ?? permsUser.role}</strong> role.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPermsUser(null)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#5c5e62] transition hover:bg-[#f0f2f5]"
              >
                <X size={15} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {permsError && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[0.83rem] text-red-700">
                  <AlertCircle size={13} className="shrink-0" />
                  {permsError}
                </div>
              )}

              {!catalog ? (
                <p className="py-8 text-center text-[0.83rem] text-[#5c5e62]">
                  {permsError ? "Could not load permissions." : "Loading permissions…"}
                </p>
              ) : (
                Object.entries(
                  catalog.reduce<Record<string, PermissionCatalogEntry[]>>((acc, p) => {
                    (acc[p.group] ??= []).push(p);
                    return acc;
                  }, {})
                ).map(([group, entries]) => {
                  const defaults = roleDefaults(catalog, permsUser.role);
                  return (
                    <div key={group} className="mb-4">
                      <p className="mb-1.5 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#9ca3af]">
                        {group.replace(/_/g, " ")}
                      </p>
                      <div className="overflow-hidden rounded-xl border border-black/[0.07]">
                        {entries.map((p) => {
                          const checked   = permsChecked.has(p.key);
                          const isDefault = defaults.has(p.key);
                          const isGrant   = checked && !isDefault;
                          const isRevoke  = !checked && isDefault;
                          return (
                            <label
                              key={p.key}
                              className={`flex cursor-pointer items-center gap-3 border-b border-black/[0.05] px-3.5 py-2 last:border-0 transition hover:bg-[#fafafa] ${
                                isGrant ? "bg-emerald-50/60" : isRevoke ? "bg-red-50/50" : ""
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => togglePerm(p.key)}
                                className="h-4 w-4 shrink-0 accent-[#f4511e]"
                              />
                              <span className="flex-1 font-mono text-[0.78rem] text-[#374151]">{p.key}</span>
                              {isGrant && (
                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[0.62rem] font-bold uppercase text-emerald-700">added</span>
                              )}
                              {isRevoke && (
                                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[0.62rem] font-bold uppercase text-red-600">removed</span>
                              )}
                              {isDefault && !isRevoke && !isGrant && (
                                <span className="text-[0.65rem] text-[#c2c6cc]">role default</span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 border-t border-black/[0.06] px-6 py-4">
              <button
                type="button"
                onClick={savePermissions}
                disabled={permsSaving || !catalog}
                className="h-9 flex-1 rounded-full bg-[#f4511e] text-[0.83rem] font-semibold text-white transition hover:bg-[#df4618] disabled:opacity-60"
              >
                {permsSaving ? "Saving…" : "Save Permissions"}
              </button>
              <button
                type="button"
                onClick={resetToRole}
                disabled={!catalog}
                title="Clear every override — back to exactly the role's access"
                className="flex h-9 items-center gap-1.5 rounded-full border border-black/10 px-4 text-[0.83rem] font-semibold text-[#1a1a1a] transition hover:bg-[#f0f2f5] disabled:opacity-60"
              >
                <RotateCcw size={13} />
                Reset to role
              </button>
            </div>
            <p className="px-6 pb-4 text-center text-[0.7rem] text-[#9ca3af]">
              Access changes on the server immediately; their sidebar updates at next login.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
