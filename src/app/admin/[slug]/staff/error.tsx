"use client";

import { Button } from "@/components/ui/button";

export default function StaffError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
      <h2 className="text-lg font-bold">Staff management failed to load</h2>
      <p className="mt-2 text-sm">{error.message || "Check Firestore permissions and try again."}</p>
      <Button className="mt-4" onClick={reset}>Try again</Button>
    </div>
  );
}
