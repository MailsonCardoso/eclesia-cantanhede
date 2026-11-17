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
    <div className="metric-card rounded-2xl border bg-card p-3 sm:p-5 shadow-card min-w-0 overflow-hidden">
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <span className="text-xs sm:text-sm text-muted-foreground font-medium leading-snug line-clamp-2">{label}</span>
        <div className={`grid size-8 sm:size-10 shrink-0 place-items-center rounded-xl ${tones[tone]}`}><Icon className="size-4 sm:size-5" /></div>
      </div>
      <div className="mt-2 sm:mt-3 break-words text-xl sm:text-2xl font-bold tabular-nums text-foreground">{value}</div>
      {detail && <p className="mt-1.5 sm:mt-2 text-[11px] sm:text-xs text-muted-foreground truncate">{detail}</p>}
    </div>
  );
}