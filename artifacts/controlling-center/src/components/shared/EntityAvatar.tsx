import { Building2 } from "lucide-react";
import type { EntityMeta } from "@/data/types";

interface EntityAvatarProps {
  entity?: Pick<EntityMeta, "code" | "name" | "color" | "logo">;
  logo?: string | null;
  label?: string;
  color?: string;
  isGroup?: boolean;
  size?: number;
  className?: string;
}

function initials(code?: string, name?: string) {
  if (code) return code.replace(/[^A-Za-z0-9&]/g, "").slice(0, 3).toUpperCase();
  if (name) return name.slice(0, 2).toUpperCase();
  return "?";
}

export function EntityAvatar({ entity, logo, label, color, isGroup, size = 28, className = "" }: EntityAvatarProps) {
  const img = logo ?? entity?.logo ?? null;
  const bg = color ?? entity?.color ?? "hsl(216 65% 11%)";
  const text = label ?? initials(entity?.code, entity?.name);
  const dim = { width: size, height: size };
  const fontSize = Math.max(8, Math.round(size * 0.34));

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-black/5 ${className}`}
      style={img ? { ...dim, backgroundColor: "#fff" } : { ...dim, backgroundColor: bg }}
    >
      {img ? (
        <img src={img} alt={entity?.name ?? label ?? "Logo"} className="h-full w-full object-cover" />
      ) : isGroup ? (
        <Building2 className="text-white" style={{ width: size * 0.5, height: size * 0.5 }} />
      ) : (
        <span className="font-semibold leading-none text-white" style={{ fontSize }}>
          {text}
        </span>
      )}
    </span>
  );
}
