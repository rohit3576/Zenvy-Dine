import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-5 md:flex-row md:items-end md:justify-between", className)}>
      <div className="max-w-3xl space-y-3">
        {eyebrow && (
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
            {eyebrow}
          </p>
        )}
        <div className="space-y-2">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            {title}
          </h2>
          {description && (
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
              {description}
            </p>
          )}
        </div>
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  detail,
  tone = "emerald",
}: {
  title: string;
  value: string;
  icon: LucideIcon;
  detail?: string;
  tone?: "emerald" | "amber" | "blue" | "rose";
}) {
  const tones = {
    emerald: "from-emerald-50 text-emerald-600 ring-emerald-200",
    amber: "from-amber-50 text-amber-600 ring-amber-200",
    blue: "from-blue-50 text-blue-600 ring-blue-200",
    rose: "from-red-50 text-red-600 ring-red-200",
  };

  return (
    <Card className={cn("relative overflow-hidden bg-gradient-to-br to-transparent", tones[tone])}>
      <CardContent className="space-y-5 p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {title}
          </span>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white ring-1 ring-black/[0.06] shadow-sm">
            <Icon className="h-5 w-5" />
          </span>
        </div>
        <div className="space-y-1">
          <p className="text-3xl font-semibold tracking-tight text-foreground">{value}</p>
          {detail && <p className="text-sm text-muted-foreground">{detail}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "green" | "amber" | "blue" | "red" | "purple";
}) {
  const tones = {
    neutral: "border-slate-200 bg-slate-100 text-slate-600",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    red: "border-red-200 bg-red-50 text-red-700",
    purple: "border-purple-200 bg-purple-50 text-purple-700",
  };

  return (
    <Badge variant="outline" className={cn("h-6 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide", tones[tone])}>
      {children}
    </Badge>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-3xl border border-dashed border-black/[0.08] bg-white p-8 text-center shadow-[0_12px_32px_rgba(15,23,42,0.04)]">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-primary ring-1 ring-blue-100">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
