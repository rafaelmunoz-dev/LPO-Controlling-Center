import { useTranslation } from "react-i18next";
import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Small badge marking a user as an Admin (elevated permission level).
export function AdminBadge({ className = "" }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <Badge
      variant="outline"
      className={`gap-1 border-primary/30 bg-primary/10 text-primary font-semibold ${className}`}
      data-testid="badge-admin"
    >
      <ShieldCheck className="h-3 w-3" />
      {t("role_admin")}
    </Badge>
  );
}
