import type { LucideIcon } from "lucide-react";

interface PanelHeaderProps {
  icon: LucideIcon;
  color: string;
  title: string;
  subtitle?: string;
  statValue?: string;
  statLabel?: string;
  statClass?: string;
}

export function PanelHeader({
  icon: Icon,
  color,
  title,
  subtitle,
  statValue,
  statLabel,
  statClass,
}: PanelHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
          style={{
            color,
            backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)`,
            boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${color} 28%, transparent)`,
          }}
        >
          <Icon className="h-[1.15rem] w-[1.15rem]" strokeWidth={2.1} />
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold uppercase tracking-wide text-primary">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      {statValue && (
        <div className="shrink-0 text-right">
          <div className={`text-2xl font-bold leading-none ${statClass ?? "text-primary"}`}>
            {statValue}
          </div>
          {statLabel && (
            <div className="mt-1 text-[0.7rem] text-muted-foreground">{statLabel}</div>
          )}
        </div>
      )}
    </div>
  );
}
