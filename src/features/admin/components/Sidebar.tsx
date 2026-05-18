"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Utensils, 
  Table as TableIcon, 
  ClipboardList, 
  CookingPot, 
  BellRing,
  Settings, 
  Users,
  LogOut
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

  return (
    <div className="w-64 border-r bg-card flex flex-col h-screen sticky top-0">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary">Zenvy Dine</h1>
        <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-bold">Admin Panel</p>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              route.active 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <route.icon className="w-5 h-5" />
            {route.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={async () => {
            await signOut(auth);
            clearFirebaseSession();
            router.replace("/login");
          }}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  );
}
