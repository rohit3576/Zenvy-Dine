import { ReactNode } from "react";

export function AdminAlert({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
      {children}
    </div>
  );
}

export function AdminEmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-black/[0.08] bg-white px-6 py-16 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
