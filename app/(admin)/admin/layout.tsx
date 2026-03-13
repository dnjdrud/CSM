import { requireAdmin } from "@/lib/admin/guard";
import { AdminSidebar } from "./_components/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto w-full max-w-2xl px-4 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
