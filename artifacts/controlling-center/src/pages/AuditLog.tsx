import { useState } from "react";
import { useAppStore } from "@/hooks/use-app-context";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page";
import { ScrollText, Search } from "lucide-react";

const ACTION_TONE: Record<string, string> = {
  create: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  edit: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  delete: "bg-destructive/10 text-destructive border-destructive/20",
  login: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  logout: "bg-slate-500/10 text-slate-600 border-slate-500/20",
};

export default function AuditLog() {
  const { t } = useTranslation();
  const { auditLog } = useAppStore();
  const [search, setSearch] = useState("");

  const list = auditLog.filter((e) =>
    `${e.user} ${e.role} ${e.action} ${e.detail}`.toLowerCase().includes(search.toLowerCase())
  );

  const verb = (action: string) => action.split(":")[1] ?? action;

  return (
    <div className="space-y-6">
      <PageHeader title={t("audit_title")} subtitle={t("audit_subtitle")} icon={<ScrollText className="h-5 w-5" />} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="glass-card"><CardContent className="pt-6"><div className="text-2xl font-bold text-primary">{auditLog.length}</div><div className="text-sm text-muted-foreground mt-1">{t("audit_total")}</div></CardContent></Card>
        <Card className="glass-card"><CardContent className="pt-6"><div className="text-2xl font-bold text-primary">{auditLog.filter((e) => verb(e.action) === "create").length}</div><div className="text-sm text-muted-foreground mt-1">{t("audit_creates")}</div></CardContent></Card>
        <Card className="glass-card"><CardContent className="pt-6"><div className="text-2xl font-bold text-destructive">{auditLog.filter((e) => verb(e.action) === "delete").length}</div><div className="text-sm text-muted-foreground mt-1">{t("audit_deletes")}</div></CardContent></Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <CardTitle>{t("audit_activities")}</CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder={t("common_search")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 w-56" data-testid="input-search-audit" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("audit_time")}</TableHead>
                <TableHead>{t("audit_user")}</TableHead>
                <TableHead>{t("audit_role")}</TableHead>
                <TableHead>{t("audit_action")}</TableHead>
                <TableHead>{t("audit_detail")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((e) => (
                <TableRow key={e.id} data-testid={`row-audit-${e.id}`}>
                  <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">{e.timestamp}</TableCell>
                  <TableCell className="font-medium">{e.user}</TableCell>
                  <TableCell className="text-muted-foreground">{e.role}</TableCell>
                  <TableCell><Badge variant="outline" className={ACTION_TONE[verb(e.action)] ?? ""}>{e.action}</Badge></TableCell>
                  <TableCell>{e.detail}</TableCell>
                </TableRow>
              ))}
              {list.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">{t("audit_empty")}</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
