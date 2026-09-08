import type { Metadata } from "next";
import TodoBoard from "@/components/admin/todo-board";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Team To-Dos" };

type SearchParams = Promise<{ todo?: string }>;

export default async function TodosPage({ searchParams }: { searchParams: SearchParams }) {
  const { todo } = await searchParams;

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[#f4511e]">
          Team To-Dos
        </p>
        <p className="mt-0.5 text-[0.875rem] text-[#5c5e62]">
          One shared list — anyone adds, tag a teammate and it lands in their My Work
        </p>
      </div>
      <TodoBoard initialTodo={todo ? Number(todo) : null} />
    </div>
  );
}
