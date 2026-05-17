"use client";

import { Button } from "@/components/ui/button";

export default function WaiterCallsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error("Waiter calls route error:", error);

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
      <h2 className="text-lg font-semibold">Waiter calls could not load</h2>
      <p className="mt-2 text-sm">
        The realtime waiter call subscription failed. Verify Firestore rules, indexes, and the active restaurant context.
      </p>
      <Button className="mt-4" variant="outline" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
