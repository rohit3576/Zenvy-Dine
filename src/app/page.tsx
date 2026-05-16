import Link from "next/link";
import { ClipboardList, CookingPot, QrCode, Settings, UtensilsCrossed } from "lucide-react";

const demoSlug = "spice-garden";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center gap-10 px-6 py-10">
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <UtensilsCrossed className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Zenvy Dine</p>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">QR ordering for real restaurant service.</h1>
            </div>
          </div>
          <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
            Demo-ready customer ordering, live kitchen updates, table QR management, waiter calls, receipts, and Razorpay-ready checkout.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link className="rounded-lg border bg-card p-5 transition hover:border-primary" href={`/r/${demoSlug}/table/1`}>
            <QrCode className="mb-4 h-6 w-6 text-primary" />
            <h2 className="font-semibold">Customer Menu</h2>
            <p className="mt-2 text-sm text-muted-foreground">Open the table ordering flow for the demo restaurant.</p>
          </Link>
          <Link className="rounded-lg border bg-card p-5 transition hover:border-primary" href={`/admin/${demoSlug}/orders`}>
            <ClipboardList className="mb-4 h-6 w-6 text-primary" />
            <h2 className="font-semibold">Live Orders</h2>
            <p className="mt-2 text-sm text-muted-foreground">Monitor realtime orders and print receipts.</p>
          </Link>
          <Link className="rounded-lg border bg-card p-5 transition hover:border-primary" href={`/admin/${demoSlug}/kds`}>
            <CookingPot className="mb-4 h-6 w-6 text-primary" />
            <h2 className="font-semibold">Kitchen Display</h2>
            <p className="mt-2 text-sm text-muted-foreground">Move confirmed orders through kitchen prep.</p>
          </Link>
          <Link className="rounded-lg border bg-card p-5 transition hover:border-primary" href={`/admin/${demoSlug}/settings`}>
            <Settings className="mb-4 h-6 w-6 text-primary" />
            <h2 className="font-semibold">Restaurant Setup</h2>
            <p className="mt-2 text-sm text-muted-foreground">Adjust GST, service charge, WhatsApp, and theme colors.</p>
          </Link>
        </div>
      </section>
    </main>
  );
}
