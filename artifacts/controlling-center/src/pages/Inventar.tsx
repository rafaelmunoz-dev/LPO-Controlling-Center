import { useState } from "react";
import { useAppStore } from "@/hooks/use-app-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page";
import { Term } from "@/components/shared/Term";
import { AiInsight } from "@/components/shared/AiInsight";
import { UploadPanel } from "@/components/shared/UploadPanel";
import { scopeByEntity, INVENTORY, formatCurrency, formatNumber } from "@/data";
import type { InventoryItem } from "@/data/types";
import { Boxes, QrCode, Search, TrendingDown, ClipboardCheck, CheckCircle2, AlertTriangle, HelpCircle, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { INVENTORY_EDIT_ROLES } from "@/data/governance";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";
import { jsPDF } from "jspdf";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, Cell } from "recharts";
import { useTranslation } from "react-i18next";

const STATUS_TONE: Record<string, string> = {
  zugewiesen: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  verfügbar: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  "in Reparatur": "bg-amber-500/10 text-amber-600 border-amber-500/20",
  verloren: "bg-destructive/10 text-destructive border-destructive/20",
  ausgemustert: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  verkauft: "bg-slate-500/10 text-slate-600 border-slate-500/20",
};

const NAVY = "hsl(216 65% 11%)";

type CountState = "offen" | "gezählt" | "abweichend" | "fehlt";
const COUNT_TONE: Record<CountState, string> = {
  offen: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  gezählt: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  abweichend: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  fehlt: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function Inventar() {
  const { t } = useTranslation();
  const { selectedEntity, currentUser } = useAppStore();
  const canEditInv = INVENTORY_EDIT_ROLES.includes(currentUser.role);
  const all = scopeByEntity(INVENTORY, selectedEntity);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("alle");
  const [selected, setSelected] = useState<string[]>([]);
  const [counts, setCounts] = useState<Record<string, CountState>>({});

  const list = all.filter((i) => {
    const matchSearch = `${i.name} ${i.inventoryNumber} ${i.assignedTo}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "alle" || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const setCount = (id: string, v: CountState) => {
    if (!canEditInv) { toast.error(t("no_permission")); return; }
    setCounts((c) => ({ ...c, [id]: v }));
  };

  const generateLabels = async () => {
    if (!canEditInv) { toast.error(t("no_permission")); return; }
    const items = INVENTORY.filter((i) => selected.includes(i.id));
    if (items.length === 0) { toast.error("Bitte mindestens ein Gerät auswählen."); return; }
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const labelW = 90, labelH = 50, marginX = 12, marginY = 14, gapY = 6;
    let x = marginX, y = marginY, col = 0;

    for (const item of items) {
      const qrData = await QRCode.toDataURL(`MIGU|${item.inventoryNumber}|${item.name}|${item.entity}`, { margin: 0, width: 120 });
      const canvas = document.createElement("canvas");
      JsBarcode(canvas, item.inventoryNumber, { format: "CODE128", displayValue: false, height: 40, margin: 0 });
      const barcode = canvas.toDataURL("image/png");

      doc.setDrawColor(214, 220, 230);
      doc.roundedRect(x, y, labelW, labelH, 2, 2);
      doc.setFontSize(8); doc.setTextColor(120);
      doc.text("MiGu Group · Inventar", x + 5, y + 6);
      doc.setFontSize(11); doc.setTextColor(20, 30, 60);
      doc.text(item.name.slice(0, 26), x + 5, y + 13);
      doc.setFontSize(9); doc.setTextColor(90);
      doc.text(item.inventoryNumber, x + 5, y + 19);
      doc.text(`Entität: ${item.entity}`, x + 5, y + 24);
      doc.text(`Zugewiesen: ${item.assignedTo}`, x + 5, y + 29);
      doc.addImage(qrData, "PNG", x + labelW - 26, y + 6, 20, 20);
      doc.addImage(barcode, "PNG", x + 5, y + 34, labelW - 12, 10);

      col++;
      if (col % 2 === 0) { x = marginX; y += labelH + gapY; } else { x = marginX + labelW + 8; }
      if (y + labelH > 285) { doc.addPage(); x = marginX; y = marginY; col = 0; }
    }
    doc.save(`inventar_labels_${selectedEntity}.pdf`);
    toast.success(`${items.length} Etikett(en) als PDF erstellt.`);
  };

  const totalValue = all.reduce((a, i) => a + i.currentValue, 0);
  const totalPurchase = all.reduce((a, i) => a + i.purchasePrice, 0);
  const byCategory = Object.entries(
    all.reduce<Record<string, number>>((acc, i) => { acc[i.category] = (acc[i.category] ?? 0) + i.currentValue; return acc; }, {})
  ).map(([category, value]) => ({ category, value }));

  const countedTotal = Object.values(counts).filter((v) => v && v !== "offen").length;
  const countProgress = all.length ? Math.round((countedTotal / all.length) * 100) : 0;
  const discrepancies = all.filter((i) => counts[i.id] === "abweichend" || counts[i.id] === "fehlt");

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("inventar")}
        subtitle={t("inv_subtitle")}
        icon={<Boxes className="h-5 w-5" />}
        actions={<Button onClick={generateLabels} disabled={!canEditInv || selected.length === 0} data-testid="button-labels"><QrCode className="h-4 w-4 mr-1.5" /> {t("labels")} ({selected.length})</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="glass-card"><CardContent className="pt-6"><div className="text-2xl font-bold text-primary">{all.length}</div><div className="text-sm text-muted-foreground mt-1">{t("inv_devices")}</div></CardContent></Card>
        <Card className="glass-card"><CardContent className="pt-6"><div className="text-2xl font-bold text-primary">{formatCurrency(totalValue)}</div><div className="text-sm text-muted-foreground mt-1"><Term k="inventur">{t("inv_current_value")}</Term></div></CardContent></Card>
        <Card className="glass-card"><CardContent className="pt-6"><div className="text-2xl font-bold text-primary">{formatCurrency(totalPurchase)}</div><div className="text-sm text-muted-foreground mt-1">{t("inv_purchase_value")}</div></CardContent></Card>
        <Card className="glass-card"><CardContent className="pt-6"><div className="text-2xl font-bold text-destructive flex items-center gap-1"><TrendingDown className="h-5 w-5" />{formatCurrency(totalPurchase - totalValue)}</div><div className="text-sm text-muted-foreground mt-1"><Term k="depreciation">{t("inv_value_loss")}</Term></div></CardContent></Card>
      </div>

      <AiInsight context="inventar" />

      <Tabs defaultValue="bestand">
        <TabsList>
          <TabsTrigger value="bestand" data-testid="tab-bestand">{t("inv_tab_stock")}</TabsTrigger>
          <TabsTrigger value="inventur" data-testid="tab-inventur">{t("stocktaking")}</TabsTrigger>
          <TabsTrigger value="belege" data-testid="tab-belege">{t("tab_uploads")}</TabsTrigger>
        </TabsList>

        <TabsContent value="bestand" className="space-y-6">
          <Card className="glass-card">
            <CardHeader><CardTitle>{t("inv_value_by_category")}</CardTitle></CardHeader>
            <CardContent className="pl-0">
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byCategory}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="category" axisLine={false} tickLine={false} fontSize={11} />
                    <YAxis axisLine={false} tickLine={false} fontSize={11} tickFormatter={(v) => formatNumber(v)} width={70} />
                    <RTooltip formatter={(v: number) => formatCurrency(v)} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>{byCategory.map((_, i) => <Cell key={i} fill={NAVY} />)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <CardTitle>{t("inv_devices_assets")}</CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder={t("common_search")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 w-48" data-testid="input-search-inventory" />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40" data-testid="select-status-filter"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alle">{t("inv_all_status")}</SelectItem>
                      {["zugewiesen", "verfügbar", "in Reparatur", "verloren", "ausgemustert"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead><TableHead>{t("common_inv_no")}</TableHead><TableHead>{t("common_device")}</TableHead><TableHead>{t("category")}</TableHead>
                    <TableHead>{t("entity")}</TableHead><TableHead>{t("inv_assigned")}</TableHead><TableHead className="text-right">{t("value")}</TableHead><TableHead>{t("inv_depreciation_short")}</TableHead><TableHead>{t("status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((i: InventoryItem) => (
                    <TableRow key={i.id} data-testid={`row-inventory-${i.id}`}>
                      <TableCell><Checkbox checked={selected.includes(i.id)} onCheckedChange={() => toggle(i.id)} data-testid={`check-${i.id}`} /></TableCell>
                      <TableCell className="font-mono text-xs">{i.inventoryNumber}</TableCell>
                      <TableCell className="font-medium">{i.name}</TableCell>
                      <TableCell>{i.category}</TableCell>
                      <TableCell>{i.entity}</TableCell>
                      <TableCell className="text-muted-foreground">{i.assignedTo}</TableCell>
                      <TableCell className="text-right">{formatCurrency(i.currentValue)}</TableCell>
                      <TableCell className="text-muted-foreground">{i.depreciation}%</TableCell>
                      <TableCell><Badge variant="outline" className={STATUS_TONE[i.status] ?? ""}>{i.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                  {list.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">{t("inv_empty_devices")}</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventur">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-primary" /> <Term k="inventur">{t("inv_count_title")}</Term></CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{t("inv_count_subtitle")}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => { setCounts({}); toast.message("Zählung zurückgesetzt."); }} data-testid="button-reset-count"><RotateCcw className="h-4 w-4 mr-1.5" /> {t("common_reset")}</Button>
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("common_progress")}</span>
                  <span className="font-medium">{countedTotal} / {all.length} · {discrepancies.length} {t("inv_differences")}</span>
                </div>
                <Progress value={countProgress} className="[&>div]:bg-emerald-500" />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("common_inv_no")}</TableHead><TableHead>{t("common_device")}</TableHead><TableHead>{t("entity")}</TableHead><TableHead>{t("inv_count_status")}</TableHead><TableHead className="text-right">{t("inv_capture")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {all.map((i) => {
                    const st = counts[i.id] ?? "offen";
                    return (
                      <TableRow key={i.id} data-testid={`count-row-${i.id}`}>
                        <TableCell className="font-mono text-xs">{i.inventoryNumber}</TableCell>
                        <TableCell className="font-medium">{i.name}</TableCell>
                        <TableCell>{i.entity}</TableCell>
                        <TableCell><Badge variant="outline" className={COUNT_TONE[st]}>{st}</Badge></TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button size="icon" variant="outline" disabled={!canEditInv} className="h-7 w-7 text-emerald-600" onClick={() => setCount(i.id, "gezählt")} data-testid={`button-count-ok-${i.id}`}><CheckCircle2 className="h-4 w-4" /></Button>
                            <Button size="icon" variant="outline" disabled={!canEditInv} className="h-7 w-7 text-amber-600" onClick={() => setCount(i.id, "abweichend")} data-testid={`button-count-diff-${i.id}`}><AlertTriangle className="h-4 w-4" /></Button>
                            <Button size="icon" variant="outline" disabled={!canEditInv} className="h-7 w-7 text-destructive" onClick={() => setCount(i.id, "fehlt")} data-testid={`button-count-missing-${i.id}`}><HelpCircle className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="flex justify-end mt-4">
                <Button disabled={!canEditInv || countedTotal === 0} onClick={() => toast.success(`Inventur abgeschlossen: ${countedTotal} gezählt, ${discrepancies.length} Differenzen.`)} data-testid="button-finish-count">{t("finish_stocktaking")}</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="belege">
          <UploadPanel docTypes={["Inventurliste"]} defaultDocType="Inventurliste" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
