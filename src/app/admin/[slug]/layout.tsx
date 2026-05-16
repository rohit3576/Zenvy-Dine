import { Metadata } from "next";
import AdminGuard from "@/features/auth/components/AdminGuard";
import { Sidebar } from "@/features/admin/components/Sidebar";

export const metadata: Metadata = {
  title: "Admin Dashboard - Zenvy Dine",
};

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-muted/20">
        <Sidebar slug={slug} />
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </AdminGuard>
  );
}
