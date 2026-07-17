"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Product } from "@/components/shop/data";

const MAX_COMPARE = 4;

type CompareContextType = {
  products: Product[];
  toggle: (product: Product) => void;
  remove: (productId: number) => void;
  clear: () => void;
  isComparing: (productId: number) => boolean;
  isFull: boolean;
  modalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
};

const DEFAULT_COMPARE: CompareContextType = {
  products: [],
  toggle: () => {},
  remove: () => {},
  clear: () => {},
  isComparing: () => false,
  isFull: false,
  modalOpen: false,
  openModal: () => {},
  closeModal: () => {},
};

const CompareContext = createContext<CompareContextType>(DEFAULT_COMPARE);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Hydrate from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("okelcor-compare");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time localStorage hydration, same pattern as cart-context.tsx
      if (saved) setProducts(JSON.parse(saved));
    } catch {
      // ignore corrupt storage
    }
    setHydrated(true);
  }, []);

  // Persist to localStorage on any change (only after hydration)
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem("okelcor-compare", JSON.stringify(products));
    }
  }, [products, hydrated]);

  const toggle = (product: Product) => {
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) return prev.filter((p) => p.id !== product.id);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, product];
    });
  };

  const remove = (productId: number) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const clear = () => {
    setProducts([]);
    setModalOpen(false);
  };

  const isComparing = (productId: number) => products.some((p) => p.id === productId);

  return (
    <CompareContext.Provider
      value={{
        products,
        toggle,
        remove,
        clear,
        isComparing,
        isFull: products.length >= MAX_COMPARE,
        modalOpen,
        openModal: () => setModalOpen(true),
        closeModal: () => setModalOpen(false),
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  return useContext(CompareContext);
}

export { MAX_COMPARE };
