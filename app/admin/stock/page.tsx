import type { Metadata } from "next";
import StockLedgerBoard from "@/components/admin/stock-ledger-board";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Stock Ledger — Admin" };

export default function StockLedgerPage() {
  return <StockLedgerBoard />;
}
