import { useState } from "react";
import { useAppStore } from "@/hooks/use-app-context";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageHeader, riskLabel } from "@/components/shared/page";
import { can } from "@/data/governance";
import { AiInsight } from "@/components/shared/AiInsight";
import { REPORTS, getFinance, getEntityComparison, formatCurrency, groupViewKey, labelForView } from "@/data";
import type { ViewKey } from "@/data/types";
import { FileBarChart, Download, FileText, Calendar, Save, Sparkles, FileSpreadsheet, FileType } from "lucide-react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";

const PERIODS = ["Mai 2026", "Q2 2026", "Geschäftsjahr 2026"];
const TYPE_KEY: Record<string, string> = {
  Monatsbericht: "rep_type_month",
  Quartalsbericht: "rep_type_quarter",
  Jahresbericht: "rep_type_year",
  "Ad-hoc-Analyse": "rep_type_adhoc",
};
const SECTIONS: { key: string; labelKey: string }[] = [
  { key: "kpis", labelKey: "rep_sec_kpis" },
  { key: "comparison", labelKey: "entity_comparison" },
  { key: "risks", labelKey: "rep_sec_risks" },
  { key: "forecast", labelKey: "rep_sec_forecast" },
];

export default function Reports() {
  const { t } = useTranslation();
  const { selectedEntity, reportDrafts, addReportDraft, currentUser, groups, entities } = useAppStore();
  const canCreate = can(currentUser.role, "reports:create");
  const entityViews: ViewKey[] = groups
    .filter((g) => !g.archived)
    .flatMap((g) => [
      groupViewKey(g.id) as ViewKey,
      ...entities.filter((e) => e.groupId === g.id && !e.archived).map((e) => e.code as ViewKey),
    ]);
  const [generating, setGenerating] = useState(false);
  const [title, setTitle] = useState(t("rep_default_title"));
  const [type, setType] = useState("Monatsbericht");
  const [entity, setEntity] = useState<ViewKey>(selectedEntity);
  const [period, setPeriod] = useState(PERIODS[0]);
  const [sections, setSections] = useState<Record<string, boolean>>({ kpis: true, comparison: true, risks: false, forecast: false });
  const [aiSummary, setAiSummary] = useState(true);

  const toggleSection = (k: string) => setSections((s) => ({ ...s, [k]: !s[k] }));

  const PERIOD_KEY: Record<string, string> = { "Mai 2026": "rep_period_may", "Geschäftsjahr 2026": "rep_period_fy" };
  const REPORT_TYPE_KEY: Record<string, string> = { Finanzen: "finanzen", "Entitäten": "entitaeten", Einkauf: "einkauf", Inventar: "inventar", Risiko: "risk_risk", Strategie: "strategie", Freigaben: "freigaben" };
  const RECURRENCE_KEY: Record<string, string> = { Monatlich: "rec_monatlich", Quartalsweise: "rec_quartalsweise", "Jährlich": "rec_jaehrlich", "Auf Abruf": "rec_aufabruf" };
  const periodLabel = (p: string) => (PERIOD_KEY[p] ? t(PERIOD_KEY[p]) : p);
  const categoryLabel = (c: string) => (REPORT_TYPE_KEY[c] ? t(REPORT_TYPE_KEY[c]) : c);
  const recurrenceLabel = (p: string) => (RECURRENCE_KEY[p] ? t(RECURRENCE_KEY[p]) : p);
  const reportTitle = (id: string) => t(`rt_${id.toLowerCase().replace("-", "")}_title`);
  const reportDesc = (id: string) => t(`rt_${id.toLowerCase().replace("-", "")}_desc`);
  const typeLabel = (tp: string) => (TYPE_KEY[tp] ? t(TYPE_KEY[tp]) : tp);

  const buildAiSummary = (view: ViewKey) => {
    const fin = getFinance(view);
    return t("rep_ai_summary", {
      entity: view,
      period: periodLabel(period),
      revenue: formatCurrency(fin.revenue),
      margin: fin.ebitdaMargin.toFixed(1),
      cash: formatCurrency(fin.cash),
      runway: fin.cashRunway.toFixed(1),
      open: formatCurrency(fin.openInvoices),
      risk: riskLabel(t, fin.riskLevel),
    });
  };

  const downloadDelimited = (delimiter: string, ext: string, label: string, view: ViewKey, docTitle: string) => {
    if (!canCreate) { toast.error(t("no_permission")); return; }
    const fin = getFinance(view);
    const comparison = getEntityComparison();
    const lines: string[][] = [
      ["LPO Controlling Center"],
      ["Bericht", docTitle],
      ["Entität", view],
      ["Zeitraum", period],
      [],
      ["Kennzahl", "Wert"],
      ["Umsatz", String(fin.revenue)],
      ["Operativer Gewinn (EBITDA)", String(fin.ebitda)],
      ["Gewinn", String(fin.netProfit)],
      ["Liquidität", String(fin.cash)],
      ["Operative Marge (EBITDA) %", fin.ebitdaMargin.toFixed(1)],
      ["Offene Forderungen", String(fin.openInvoices)],
      [],
      ["Entität", "Umsatz", "Operativer Gewinn (EBITDA)", "Risiko"],
      ...comparison.map((c) => [c.code, String(c.revenue), String(c.ebitda), c.riskLevel]),
    ];
    const csv = lines.map((row) => row.map((cell) => /[",;\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell).join(delimiter)).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${docTitle.replace(/\s+/g, "_")}_${view}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("toast_report_exported", { format: label }));
  };

  const generatePdf = (overrideTitle?: string, overrideEntity?: ViewKey) => {
    if (!canCreate) { toast.error(t("no_permission")); return; }
    setGenerating(true);
    const view = overrideEntity ?? entity;
    const docTitle = overrideTitle ?? title;
    const fin = getFinance(view);
    const comparison = getEntityComparison();
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    doc.setFillColor(17, 28, 56);
    doc.rect(0, 0, 210, 32, "F");
    doc.setTextColor(255); doc.setFontSize(18);
    doc.text("LPO CONTROLLING CENTER", 14, 16);
    doc.setFontSize(10); doc.setTextColor(198, 168, 110);
    doc.text("Transparenz. Kontrolle. Zukunft.", 14, 23);

    doc.setTextColor(20, 30, 60); doc.setFontSize(15);
    doc.text(docTitle, 14, 46);
    doc.setFontSize(10); doc.setTextColor(110);
    doc.text(`Entitat: ${view}   -   Zeitraum: ${period}   -   Erstellt: ${new Date().toLocaleDateString("de-DE")}`, 14, 53);

    let y = 64;
    doc.setDrawColor(220); doc.line(14, 58, 196, 58);

    if (aiSummary) {
      doc.setTextColor(20, 30, 60); doc.setFontSize(12);
      doc.text("KI-Zusammenfassung", 14, y); y += 7;
      doc.setFontSize(9); doc.setTextColor(70);
      const summaryLines = doc.splitTextToSize(buildAiSummary(view), 182);
      doc.text(summaryLines, 14, y); y += summaryLines.length * 5 + 6;
    }

    if (sections.kpis) {
      doc.setTextColor(20, 30, 60); doc.setFontSize(12);
      doc.text("Finanzkennzahlen", 14, y); y += 8;
      doc.setFontSize(10); doc.setTextColor(60);
      const kpis: [string, string][] = [
        ["Umsatz", formatCurrency(fin.revenue)],
        ["Operativer Gewinn (EBITDA)", formatCurrency(fin.ebitda)],
        ["Gewinn", formatCurrency(fin.netProfit)],
        ["Liquiditaet", formatCurrency(fin.cash)],
        ["Operative Marge (EBITDA)", `${fin.ebitdaMargin.toFixed(1)} %`],
        ["Offene Forderungen", formatCurrency(fin.openInvoices)],
      ];
      kpis.forEach(([k, v]) => { doc.text(k, 16, y); doc.text(v, 120, y); y += 7; });
      y += 4;
    }

    if (sections.comparison) {
      doc.setFontSize(12); doc.setTextColor(20, 30, 60);
      doc.text("Entitaetsvergleich", 14, y); y += 8;
      doc.setFontSize(9); doc.setTextColor(60);
      doc.text("Entitaet", 16, y); doc.text("Umsatz", 60, y); doc.text("Operativer Gewinn (EBITDA)", 100, y); doc.text("Risiko", 178, y); y += 2;
      doc.setDrawColor(230); doc.line(14, y, 196, y); y += 6;
      comparison.forEach((c) => {
        doc.text(c.code, 16, y); doc.text(formatCurrency(c.revenue), 60, y); doc.text(formatCurrency(c.ebitda), 100, y); doc.text(c.riskLevel, 178, y); y += 7;
      });
      y += 4;
    }

    if (sections.risks) {
      doc.setFontSize(12); doc.setTextColor(20, 30, 60);
      doc.text("Risiken & Pre-Mortem", 14, y); y += 8;
      doc.setFontSize(10); doc.setTextColor(60);
      doc.text(`Risikostufe ${view}: ${fin.riskLevel}`, 16, y); y += 7;
      y += 4;
    }

    if (sections.forecast) {
      doc.setFontSize(12); doc.setTextColor(20, 30, 60);
      doc.text("Prognose & Liquiditat", 14, y); y += 8;
      doc.setFontSize(10); doc.setTextColor(60);
      doc.text(`Cash Runway: ${fin.cashRunway.toFixed(1)} Monate`, 16, y); y += 7;
    }

    doc.setFontSize(8); doc.setTextColor(150);
    doc.text("Demo-Bericht - LPO Group im Auftrag der MiGu Group - Vertraulich", 14, 285);
    doc.save(`${docTitle.replace(/\s+/g, "_")}_${view}.pdf`);
    toast.success(t("rep_pdf_created"));
    setGenerating(false);
  };

  const saveDraft = () => {
    if (!canCreate) { toast.error(t("no_permission")); return; }
    addReportDraft(title, type, entity);
    toast.success(t("rep_draft_saved"));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("reports")}
        subtitle={t("rep_subtitle")}
        icon={<FileBarChart className="h-5 w-5" />}
        actions={canCreate ? <Button onClick={() => generatePdf()} disabled={generating} data-testid="button-generate-report"><Download className="h-4 w-4 mr-1.5" /> {t("bericht_erstellen")}</Button> : undefined}
      />

      <AiInsight context="reports" />

      <Card className="glass-card">
        <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> {t("rep_configure")}</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5"><Label>{t("common_title")}</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} data-testid="input-report-title" /></div>
            <div className="space-y-1.5">
              <Label>{t("rep_report_type")}</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger data-testid="select-report-type"><SelectValue /></SelectTrigger>
                <SelectContent>{["Monatsbericht", "Quartalsbericht", "Jahresbericht", "Ad-hoc-Analyse"].map((tp) => <SelectItem key={tp} value={tp}>{typeLabel(tp)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("entity")}</Label>
              <Select value={entity} onValueChange={(v) => setEntity(v as ViewKey)}>
                <SelectTrigger data-testid="select-report-entity"><SelectValue /></SelectTrigger>
                <SelectContent>{entityViews.map((v) => <SelectItem key={v} value={v}>{labelForView(v)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("period")}</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger data-testid="select-report-period"><SelectValue /></SelectTrigger>
                <SelectContent>{PERIODS.map((p) => <SelectItem key={p} value={p}>{periodLabel(p)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("rep_content")}</Label>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {SECTIONS.map((s) => (
                <label key={s.key} className="flex items-center gap-2 rounded-xl border border-border p-3 cursor-pointer hover:bg-muted/40" data-testid={`section-${s.key}`}>
                  <Checkbox checked={sections[s.key]} onCheckedChange={() => toggleSection(s.key)} />
                  <span className="text-sm">{t(s.labelKey)}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("rep_ai_options")}</Label>
            <label className="flex items-start gap-3 rounded-xl border border-border p-3 cursor-pointer hover:bg-muted/40" data-testid="section-ai-summary">
              <Checkbox checked={aiSummary} onCheckedChange={() => setAiSummary((v) => !v)} className="mt-0.5" />
              <span className="text-sm">
                <span className="flex items-center gap-1.5 font-medium"><Sparkles className="h-3.5 w-3.5 text-amber-500" /> {t("rep_ai_insert")}</span>
                <span className="text-muted-foreground">{t("rep_ai_insert_desc")}</span>
              </span>
            </label>
            {aiSummary && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-sm text-amber-900" data-testid="ai-summary-preview">
                <span className="flex items-center gap-1.5 font-medium mb-1"><Sparkles className="h-3.5 w-3.5" /> {t("rep_preview")}</span>
                {buildAiSummary(entity)}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>{t("export")}</Label>
            <div className="flex flex-wrap gap-2">
              {canCreate ? (
                <>
                  <Button onClick={() => generatePdf()} disabled={generating} data-testid="button-export-pdf"><Download className="h-4 w-4 mr-1.5" /> {t("rep_export_pdf")}</Button>
                  <Button variant="outline" onClick={() => downloadDelimited(";", "xls", "Excel", entity, title)} data-testid="button-export-excel"><FileSpreadsheet className="h-4 w-4 mr-1.5" /> {t("rep_export_excel")}</Button>
                  <Button variant="outline" onClick={() => downloadDelimited(",", "csv", "CSV", entity, title)} data-testid="button-export-csv"><FileType className="h-4 w-4 mr-1.5" /> {t("rep_export_csv")}</Button>
                  <Button variant="outline" onClick={saveDraft} data-testid="button-save-draft"><Save className="h-4 w-4 mr-1.5" /> {t("rep_save_draft")}</Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">{t("no_permission")}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {["Monatsbericht", "Quartalsbericht", "Jahresbericht"].map((tp) => (
          <Card key={tp} className="glass-card">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> {typeLabel(tp)}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">{t("rep_quick_desc", { type: typeLabel(tp), entity })}</p>
              {canCreate && <Button variant="outline" size="sm" className="w-full" onClick={() => generatePdf(tp)} data-testid={`button-quick-${tp}`}><Download className="h-4 w-4 mr-1.5" /> {t("rep_create_pdf")}</Button>}
            </CardContent>
          </Card>
        ))}
      </div>

      {reportDrafts.length > 0 && (
        <Card className="glass-card">
          <CardHeader><CardTitle>{t("rep_saved_drafts")}</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>{t("common_title")}</TableHead><TableHead>{t("type")}</TableHead><TableHead>{t("entity")}</TableHead><TableHead>{t("rep_created")}</TableHead><TableHead className="text-right">{t("common_action")}</TableHead></TableRow></TableHeader>
              <TableBody>
                {reportDrafts.map((d) => (
                  <TableRow key={d.id} data-testid={`row-draft-${d.id}`}>
                    <TableCell className="font-medium">{d.title}</TableCell>
                    <TableCell><Badge variant="outline">{typeLabel(d.type)}</Badge></TableCell>
                    <TableCell>{d.entity}</TableCell>
                    <TableCell className="text-muted-foreground">{d.createdAt}</TableCell>
                    <TableCell className="text-right">{canCreate && <Button size="sm" variant="ghost" onClick={() => generatePdf(d.title, d.entity)} data-testid={`button-export-draft-${d.id}`}><Download className="h-4 w-4" /></Button>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card className="glass-card">
        <CardHeader><CardTitle>{t("rep_available_templates")}</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>{t("common_title")}</TableHead><TableHead>{t("description")}</TableHead><TableHead>{t("rep_area")}</TableHead><TableHead>{t("rep_cadence")}</TableHead><TableHead className="text-right">{t("common_action")}</TableHead></TableRow></TableHeader>
            <TableBody>
              {REPORTS.map((r) => (
                <TableRow key={r.id} data-testid={`row-report-${r.id}`}>
                  <TableCell className="font-medium">{reportTitle(r.id)}</TableCell>
                  <TableCell className="text-muted-foreground max-w-xs">{reportDesc(r.id)}</TableCell>
                  <TableCell><Badge variant="outline">{categoryLabel(r.type)}</Badge></TableCell>
                  <TableCell className="text-muted-foreground flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {recurrenceLabel(r.period)}</TableCell>
                  <TableCell className="text-right">{canCreate && <Button size="sm" variant="ghost" onClick={() => generatePdf(r.title)} data-testid={`button-download-${r.id}`}><Download className="h-4 w-4" /></Button>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
