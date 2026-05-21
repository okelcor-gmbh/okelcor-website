"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  loginCustomer,
  logoutCustomer,
  getCustomerProfile,
  type Customer,
} from "@/lib/customer-auth";

// ─── Context type ─────────────────────────────────────────────────────────────

interface CustomerAuthContextType {
  customer: Customer | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<Customer>;
  logout: () => Promise<void>;
  refreshCustomer: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const CustomerAuthContext = createContext<CustomerAuthContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshCustomer = useCallback(async () => {
    // Admin routes use a separate cookie-based auth system.
    // Skip the customer /me fetch there — it would always 401 and pollute the network tab.
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) {
      setIsLoading(false);
      return;
    }
    try {
      const profile = await getCustomerProfile();
      setCustomer(profile);
    } catch {
      setCustomer(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCustomer();
  }, [refreshCustomer]);

  const login = useCallback(
    async (email: string, password: string): Promise<Customer> => {
      const data = await loginCustomer(email, password);
      setCustomer(data.customer);
      return data.customer;
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await logoutCustomer();
    } finally {
      setCustomer(null);
    }
  }, []);

  return (
    <CustomerAuthContext.Provider
      value={{
        customer,
        isAuthenticated: !!customer,
        isLoading,
        login,
        logout,
        refreshCustomer,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCustomerAuth(): CustomerAuthContextType {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error("useCustomerAuth must be used inside CustomerAuthProvider");
  return ctx;
}
