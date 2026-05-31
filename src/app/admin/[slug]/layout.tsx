import { Metadata } from "next";
import AdminGuard from "@/features/auth/components/AdminGuard";
import { Sidebar } from "@/features/admin/components/Sidebar";
import { requireAdminUser } from "@/lib/server-auth";

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
  await requireAdminUser(slug);

  return (
    <AdminGuard slug={slug}>
      <div className="min-h-screen text-foreground lg:flex">
        <Sidebar slug={slug} />
        <main className="min-w-0 flex-1 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
