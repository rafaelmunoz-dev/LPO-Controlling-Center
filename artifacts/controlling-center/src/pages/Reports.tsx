import { useState } from "react";
import { useAppStore } from "@/hooks/use-app-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page";
import { REPORTS, getFinance, getEntityComparison, formatCurrency } from "@/data";
import { FileBarChart, Download, FileText, Calendar } from "lucide-react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";

export default function Reports() {
  const { selectedEntity } = useAppStore();
  const [generating, setGenerating] = useState(false);

  const generatePdf = (title: string) => {
    setGenerating(true);
    const fin = getFinance(selectedEntity);
    const comparison = getEntityComparison();
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    doc.setFillColor(17, 28, 56);
    doc.rect(0, 0, 210, 32, "F");
    doc.setTextColor(255); doc.setFontSize(18);
    doc.text("LPO CONTROLLING CENTER", 14, 16);
    doc.setFontSize(10); doc.setTextColor(198, 168, 110);
    doc.text("Transparenz. Kontrolle. Zukunft.", 14, 23);

    doc.setTextColor(20, 30, 60); doc.setFontSize(15);
    doc.text(title, 14, 46);
    doc.setFontSize(10); doc.setTextColor(110);
    doc.text(`Entitat: ${selectedEntity}   -   Erstellt: ${new Date().toLocaleDateString("de-DE")}`, 14, 53);

    doc.setDrawColor(220); doc.line(14, 58, 196, 58);
    doc.setTextColor(20, 30, 60); doc.setFontSize(12);
    doc.text("Finanzkennzahlen", 14, 68);
    doc.setFontSize(10); doc.setTextColor(60);
    const kpis: [string, string][] = [
      ["Umsatz", formatCurrency(fin.revenue)],
      ["EBITDA", formatCurrency(fin.ebitda)],
      ["Gewinn", formatCurrency(fin.netProfit)],
      ["Liquiditaet", formatCurrency(fin.cash)],
      ["EBITDA-Marge", `${fin.ebitdaMargin.toFixed(1)} %`],
      ["Offene Forderungen", formatCurrency(fin.openInvoices)],
    ];
    let y = 76;
    kpis.forEach(([k, v]) => { doc.text(k, 16, y); doc.text(v, 120, y); y += 7; });

    y += 6;
    doc.setFontSize(12); doc.setTextColor(20, 30, 60);
    doc.text("Entitaetsvergleich", 14, y); y += 8;
    doc.setFontSize(9); doc.setTextColor(60);
    doc.text("Entitaet", 16, y); doc.text("Umsatz", 70, y); doc.text("EBITDA", 120, y); doc.text("Risiko", 165, y); y += 2;
    doc.setDrawColor(230); doc.line(14, y, 196, y); y += 6;
    comparison.forEach((c) => {
      doc.text(c.code, 16, y); doc.text(formatCurrency(c.revenue), 70, y); doc.text(formatCurrency(c.ebitda), 120, y); doc.text(c.riskLevel, 165, y); y += 7;
    });

    doc.setFontSize(8); doc.setTextColor(150);
    doc.text("Demo-Bericht - LPO Group im Auftrag der MiGu Group - Vertraulich", 14, 285);
    doc.save(`${title.replace(/\s+/g, "_")}_${selectedEntity}.pdf`);
    toast.success("Bericht als PDF erstellt.");
    setGenerating(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Berichte & Export"
        icon={<FileBarChart className="h-5 w-5" />}
        actions={<Button onClick={() => generatePdf("Controlling-Bericht")} disabled={generating} data-testid="button-generate-report"><Download className="h-4 w-4 mr-1.5" /> Bericht erstellen</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {["Monatsbericht", "Quartalsbericht", "Jahresbericht"].map((t) => (
          <Card key={t} className="glass-card">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> {t}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">Konsolidierter {t} mit aktuellen Kennzahlen für {selectedEntity}.</p>
              <Button variant="outline" size="sm" className="w-full" onClick={() => generatePdf(t)} data-testid={`button-quick-${t}`}><Download className="h-4 w-4 mr-1.5" /> PDF erstellen</Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass-card">
        <CardHeader><CardTitle>Verfügbare Berichtsvorlagen</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Titel</TableHead><TableHead>Beschreibung</TableHead><TableHead>Bereich</TableHead><TableHead>Turnus</TableHead><TableHead className="text-right">Aktion</TableHead></TableRow></TableHeader>
            <TableBody>
              {REPORTS.map((r) => (
                <TableRow key={r.id} data-testid={`row-report-${r.id}`}>
                  <TableCell className="font-medium">{r.title}</TableCell>
                  <TableCell className="text-muted-foreground max-w-xs">{r.description}</TableCell>
                  <TableCell><Badge variant="outline">{r.type}</Badge></TableCell>
                  <TableCell className="text-muted-foreground flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {r.period}</TableCell>
                  <TableCell className="text-right"><Button size="sm" variant="ghost" onClick={() => generatePdf(r.title)} data-testid={`button-download-${r.id}`}><Download className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
