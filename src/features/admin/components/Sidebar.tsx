"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  Utensils, 
  Table as TableIcon, 
  ClipboardList, 
  CookingPot, 
  BellRing,
  Settings, 
  Users,
  LogOut,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { clearFirebaseSession } from "@/lib/auth-session";

interface SidebarProps {
  slug: string;
}

export function Sidebar({ slug }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const routes = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: `/admin/${slug}`,
      active: pathname === `/admin/${slug}`,
    },
    {
      label: "Live Orders",
      icon: ClipboardList,
      href: `/admin/${slug}/orders`,
      active: pathname === `/admin/${slug}/orders`,
    },
    {
      label: "Kitchen (KDS)",
      icon: CookingPot,
      href: `/admin/${slug}/kds`,
      active: pathname === `/admin/${slug}/kds`,
    },
    {
      label: "Menu Management",
      icon: Utensils,
      href: `/admin/${slug}/menu`,
      active: pathname.includes(`/admin/${slug}/menu`),
    },
    {
      label: "Table Management",
      icon: TableIcon,
      href: `/admin/${slug}/tables`,
      active: pathname === `/admin/${slug}/tables`,
    },
    {
      label: "Waiter Calls",
      icon: BellRing,
      href: `/admin/${slug}/waiter-calls`,
      active: pathname === `/admin/${slug}/waiter-calls`,
    },
    {
      label: "Staff",
      icon: Users,
      href: `/admin/${slug}/staff`,
      active: pathname === `/admin/${slug}/staff`,
    },
    {
      label: "Settings",
      icon: Settings,
      href: `/admin/${slug}/settings`,
      active: pathname === `/admin/${slug}/settings`,
    },
  ];

  const logout = async () => {
    await signOut(auth);
    clearFirebaseSession();
    router.replace("/login");
  };

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-black/[0.06] bg-[#f5f5f7] p-4 lg:flex">
        <div className="mb-6 rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_10px_22px_rgba(10,132,255,0.22)]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Zenvy Dine</h1>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                Operations
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-colors duration-150",
                route.active
                  ? "text-foreground"
                  : "text-muted-foreground hover:bg-white hover:text-foreground"
              )}
            >
              {route.active && (
                <motion.span
                  layoutId="admin-active-nav"
                  className="absolute inset-0 rounded-xl border border-blue-200 bg-white shadow-[0_8px_22px_rgba(10,132,255,0.10)]"
                  transition={{ type: "spring", stiffness: 500, damping: 42 }}
                />
              )}
              <span className={cn(
                "relative flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
                route.active ? "bg-primary text-primary-foreground" : "bg-slate-100 text-muted-foreground group-hover:bg-blue-50 group-hover:text-primary"
              )}>
                <route.icon className="h-[18px] w-[18px]" />
              </span>
              <span className="relative">{route.label}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-4 rounded-2xl border border-black/[0.06] bg-white p-3 shadow-[0_8px_22px_rgba(15,23,42,0.04)]">
          <Button variant="ghost" className="h-11 w-full justify-start rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700" onClick={logout}>
            <LogOut className="mr-3 h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      <div className="fixed inset-x-3 bottom-3 z-50 rounded-2xl border border-black/[0.08] bg-white/95 p-2 shadow-[0_14px_34px_rgba(15,23,42,0.16)] backdrop-blur-xl lg:hidden">
        <nav className="grid auto-cols-[82px] grid-flow-col gap-1 overflow-x-auto no-scrollbar">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-semibold transition-colors",
                route.active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
              )}
            >
              <route.icon className="h-4 w-4" />
              <span className="max-w-full truncate">{route.label.replace(" Management", "").replace("Kitchen (KDS)", "KDS")}</span>
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
