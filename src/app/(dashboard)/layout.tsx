import { Sidebar } from "@/components/sidebar";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar - hidden on mobile, visible on md and up */}
      <aside className="hidden w-64 flex-col border-r bg-card md:flex">
        <div className="flex h-14 items-center border-b px-4">
          <h1 className="text-lg font-semibold">CashFlowOS</h1>
        </div>
        <Sidebar />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Mobile header */}
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 md:hidden">
          <h1 className="text-lg font-semibold">CashFlowOS</h1>
        </header>
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}