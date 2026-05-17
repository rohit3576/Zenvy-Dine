import { ReactNode } from "react";

export function AdminAlert({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      {children}
    </div>
  );
}

export function AdminEmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border-2 border-dashed py-16 text-center text-muted-foreground">
      {children}
    </div>
  );
}
