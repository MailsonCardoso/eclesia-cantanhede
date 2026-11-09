import type { LucideIcon } from "lucide-react";

const tones = {
  blue: "bg-chart-1/12 text-chart-1",
  violet: "bg-chart-2/12 text-chart-2",
  green: "bg-success/12 text-success",
  orange: "bg-chart-4/12 text-chart-4",
};

export function MetricCard({ label, value, icon: Icon, tone = "blue", detail }: {
  label: string; value: string | number; icon: LucideIcon;
  tone?: keyof typeof tones | undefined; detail?: string;
}) {
  return (
    <div className="metric-card rounded-xl border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className={`grid size-10 shrink-0 place-items-center rounded-lg ${tones[tone]}`}><Icon className="size-5" /></div>
      </div>
      <div className="mt-3 break-words text-2xl font-semibold tabular-nums">{value}</div>
      {detail && <p className="mt-2 text-xs text-muted-foreground">{detail}</p>}
    </div>
  );
}