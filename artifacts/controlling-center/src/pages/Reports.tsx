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
import { PageHeader } from "@/components/shared/page";
import { can } from "@/data/governance";
import { AiInsight } from "@/components/shared/AiInsight";
import { REPORTS, getFinance, getEntityComparison, formatCurrency, ENTITY_CODES } from "@/data";
import type { ViewKey } from "@/data/types";
import { FileBarChart, Download, FileText, Calendar, Save, Sparkles, FileSpreadsheet, FileType } from "lucide-react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";

const ENTITY_VIEWS: ViewKey[] = ["MiGu Group Gesamt", ...ENTITY_CODES];
const PERIODS = ["Mai 2026", "Q2 2026", "Geschäftsjahr 2026"];
const SECTIONS: { key: string; labelKey: string }[] = [
  { key: "kpis", labelKey: "rep_sec_kpis" },
  { key: "comparison", labelKey: "entity_comparison" },
  { key: "risks", labelKey: "rep_sec_risks" },
  { key: "forecast", labelKey: "rep_sec_forecast" },
];

export default function Reports() {
  const { t } = useTranslation();
  const { selectedEntity, reportDrafts, addReportDraft, currentUser } = useAppStore();
  const canCreate = can(currentUser.role, "reports:create");
  const [generating, setGenerating] = useState(false);
  const [title, setTitle] = useState("Controlling-Bericht");
  const [type, setType] = useState("Monatsbericht");
  const [entity, setEntity] = useState<ViewKey>(selectedEntity);
  const [period, setPeriod] = useState(PERIODS[0]);
  const [sections, setSections] = useState<Record<string, boolean>>({ kpis: true, comparison: true, risks: false, forecast: false });
  const [aiSummary, setAiSummary] = useState(true);

  const toggleSection = (k: string) => setSections((s) => ({ ...s, [k]: !s[k] }));

  const buildAiSummary = (view: ViewKey) => {
    const fin = getFinance(view);
    return `${view} erzielt im Zeitraum ${period} einen Umsatz von ${formatCurrency(fin.revenue)} bei einer EBITDA-Marge von ${fin.ebitdaMargin.toFixed(1)} %. Die Liquidität liegt bei ${formatCurrency(fin.cash)} (Cash Runway ${fin.cashRunway.toFixed(1)} Monate), offene Forderungen betragen ${formatCurrency(fin.openInvoices)}. Risikolage: ${fin.riskLevel}. Empfehlung: Forderungsmanagement priorisieren und Margenentwicklung im Blick behalten.`;
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
      ["EBITDA", String(fin.ebitda)],
      ["Gewinn", String(fin.netProfit)],
      ["Liquidität", String(fin.cash)],
      ["EBITDA-Marge %", fin.ebitdaMargin.toFixed(1)],
      ["Offene Forderungen", String(fin.openInvoices)],
      [],
      ["Entität", "Umsatz", "EBITDA", "Risiko"],
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
    toast.success(`Bericht als ${label} exportiert.`);
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
        ["EBITDA", formatCurrency(fin.ebitda)],
        ["Gewinn", formatCurrency(fin.netProfit)],
        ["Liquiditaet", formatCurrency(fin.cash)],
        ["EBITDA-Marge", `${fin.ebitdaMargin.toFixed(1)} %`],
        ["Offene Forderungen", formatCurrency(fin.openInvoices)],
      ];
      kpis.forEach(([k, v]) => { doc.text(k, 16, y); doc.text(v, 120, y); y += 7; });
      y += 4;
    }

    if (sections.comparison) {
      doc.setFontSize(12); doc.setTextColor(20, 30, 60);
      doc.text("Entitaetsvergleich", 14, y); y += 8;
      doc.setFontSize(9); doc.setTextColor(60);
      doc.text("Entitaet", 16, y); doc.text("Umsatz", 70, y); doc.text("EBITDA", 120, y); doc.text("Risiko", 165, y); y += 2;
      doc.setDrawColor(230); doc.line(14, y, 196, y); y += 6;
      comparison.forEach((c) => {
        doc.text(c.code, 16, y); doc.text(formatCurrency(c.revenue), 70, y); doc.text(formatCurrency(c.ebitda), 120, y); doc.text(c.riskLevel, 165, y); y += 7;
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
    toast.success("Bericht als PDF erstellt.");
    setGenerating(false);
  };

  const saveDraft = () => {
    if (!canCreate) { toast.error(t("no_permission")); return; }
    addReportDraft(title, type, entity);
    toast.success("Berichtsentwurf gespeichert.");
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
                <SelectContent>{["Monatsbericht", "Quartalsbericht", "Jahresbericht", "Ad-hoc-Analyse"].map((tp) => <SelectItem key={tp} value={tp}>{tp}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("entity")}</Label>
              <Select value={entity} onValueChange={(v) => setEntity(v as ViewKey)}>
                <SelectTrigger data-testid="select-report-entity"><SelectValue /></SelectTrigger>
                <SelectContent>{ENTITY_VIEWS.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("period")}</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger data-testid="select-report-period"><SelectValue /></SelectTrigger>
                <SelectContent>{PERIODS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
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
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> {tp}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">{t("rep_quick_desc", { type: tp, entity })}</p>
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
                    <TableCell><Badge variant="outline">{d.type}</Badge></TableCell>
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
                  <TableCell className="font-medium">{r.title}</TableCell>
                  <TableCell className="text-muted-foreground max-w-xs">{r.description}</TableCell>
                  <TableCell><Badge variant="outline">{r.type}</Badge></TableCell>
                  <TableCell className="text-muted-foreground flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {r.period}</TableCell>
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
