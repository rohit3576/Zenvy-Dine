import Link from "next/link";
import { ArrowUpRight, ClipboardList, CookingPot, QrCode, Settings, UtensilsCrossed } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/premium";
import { cn } from "@/lib/utils";

const demoSlug = "spice-garden";

const entries = [
  {
    href: `/r/${demoSlug}/table/1`,
    title: "Customer Menu",
    description: "Open the premium table ordering flow.",
    icon: QrCode,
  },
  {
    href: `/admin/${demoSlug}/orders`,
    title: "Live Orders",
    description: "Monitor realtime orders and receipts.",
    icon: ClipboardList,
  },
  {
    href: `/admin/${demoSlug}/kds`,
    title: "Kitchen Display",
    description: "Move confirmed orders through prep.",
    icon: CookingPot,
  },
  {
    href: `/admin/${demoSlug}/settings`,
    title: "Restaurant Setup",
    description: "Adjust billing, notifications, and theme.",
    icon: Settings,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen text-foreground">
      <section className="mx-auto grid min-h-screen w-full max-w-7xl gap-10 px-5 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_10px_24px_rgba(10,132,255,0.22)]">
              <UtensilsCrossed className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-primary/80">Zenvy Dine</p>
              <StatusBadge tone="green">Production SaaS</StatusBadge>
            </div>
          </div>

          <div className="max-w-3xl space-y-5">
            <h1 className="text-balance text-5xl font-semibold tracking-tight sm:text-7xl">
              Restaurant service, beautifully orchestrated.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              A premium QR ordering platform with live orders, kitchen display, table management, waiter calls, receipts, and checkout.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link className={cn(buttonVariants({ variant: "premium", size: "lg" }), "rounded-2xl")} href={`/r/${demoSlug}/table/1`}>
              Open Customer Flow
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link className={cn(buttonVariants({ variant: "glass", size: "lg" }), "rounded-2xl")} href={`/admin/${demoSlug}`}>
              Open Admin
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {entries.map((entry) => {
            const Icon = entry.icon;
            return (
              <Link
                key={entry.href}
                className="group rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_38px_rgba(15,23,42,0.09)]"
                href={entry.href}
              >
                <div className="mb-10 flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-primary ring-1 ring-blue-100">
                    <Icon className="h-6 w-6" />
                  </span>
                  <ArrowUpRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-primary" />
                </div>
                <h2 className="text-lg font-semibold">{entry.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{entry.description}</p>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
