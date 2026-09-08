import type { Metadata } from "next";
import MyWork from "@/components/admin/my-work";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My Work" };

// Deep links from a tagged task. Same contract as ?line= on the EC Invoice
// List: the task is worked HERE, so the link lands on the row rather than on
// the board or list behind it — which in the finance case most assignees
// cannot open at all, and in the to-do case is a whole list to search.
type SearchParams = Promise<{ finance_item?: string; todo?: string; claim?: string }>;

export default async function MyWorkPage({ searchParams }: { searchParams: SearchParams }) {
  const { finance_item: financeItem, todo, claim } = await searchParams;

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[#f4511e]">
          My Work
        </p>
        <p className="mt-0.5 text-[0.875rem] text-[#5c5e62]">
          Everything assigned to you that needs action — leads, follow-ups, proposals and approvals.
        </p>
      </div>

      <MyWork
        highlightFinanceItem={financeItem ? Number(financeItem) : null}
        highlightTodo={todo ? Number(todo) : null}
        highlightClaim={claim ? Number(claim) : null}
      />
    </div>
  );
}
