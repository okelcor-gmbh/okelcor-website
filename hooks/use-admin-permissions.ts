"use client";

import { useState, useEffect, useCallback } from "react";
import { canDo } from "@/lib/admin-permissions";

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

export interface AdminPermissionContext {
  /** Current admin role string, e.g. "super_admin" */
  role: string;
  /**
   * Explicit permissions array from the backend auth payload.
   * null = backend hasn't sent permissions yet (uses role-based fallback).
   */
  permissions: string[] | null;
  /**
   * Returns true if the current admin may perform the given action.
   *
   * Uses backend permissions[] when available (forward-compatible).
   * Falls back to the PERMISSION_ROLES map in lib/admin-permissions.ts.
   *
   * Always returns false while loading (prevents optimistic UI leaks).
   */
  can: (permission: string) => boolean;
  /** True until the first client-side cookie read has completed. */
  loading: boolean;
}

/**
 * Hook for permission-based UI gating in admin client components.
 *
 * Usage:
 *   const { can } = useAdminPermissions();
 *   if (can("orders.delete")) { ... }
 *
 * Do NOT gate UI on role strings directly — use can() exclusively.
 */
export function useAdminPermissions(): AdminPermissionContext {
  const [role, setRole]               = useState<string>("");
  const [permissions, setPermissions] = useState<string[] | null>(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    const r = getCookie("admin_role");
    setRole(r);

    // Forward-compatible: if the backend starts sending a permissions cookie
    // (URL-encoded JSON array), use it instead of the role map.
    // Cookie name: "admin_permissions"  Format: ["orders.view","orders.update"]
    const raw = getCookie("admin_permissions");
    if (raw) {
      try {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) setPermissions(parsed as string[]);
      } catch { /* ignore malformed cookie */ }
    }

    setLoading(false);
  }, []);

  const can = useCallback(
    (permission: string): boolean => {
      if (loading) return false;
      return canDo(role, permission, permissions);
    },
    [role, permissions, loading],
  );

  return { role, permissions, can, loading };
}
