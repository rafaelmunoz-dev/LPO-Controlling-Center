import { useState } from "react";
import { useAppStore } from "@/hooks/use-app-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page";
import { scopeByEntity, INVENTORY, formatCurrency, formatNumber } from "@/data";
import type { InventoryItem } from "@/data/types";
import { Boxes, QrCode, Search, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";
import { jsPDF } from "jspdf";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, Cell } from "recharts";

const STATUS_TONE: Record<string, string> = {
  zugewiesen: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  verfügbar: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  "in Reparatur": "bg-amber-500/10 text-amber-600 border-amber-500/20",
  verloren: "bg-destructive/10 text-destructive border-destructive/20",
  ausgemustert: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  verkauft: "bg-slate-500/10 text-slate-600 border-slate-500/20",
};

const NAVY = "hsl(216 65% 11%)";

export default function Inventar() {
  const { selectedEntity } = useAppStore();
  const all = scopeByEntity(INVENTORY, selectedEntity);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("alle");
  const [selected, setSelected] = useState<string[]>([]);

  const list = all.filter((i) => {
    const matchSearch = `${i.name} ${i.inventoryNumber} ${i.assignedTo}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "alle" || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const generateLabels = async () => {
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventar"
        subtitle="Bestand & Etiketten"
        icon={<Boxes className="h-5 w-5" />}
        actions={<Button onClick={generateLabels} disabled={selected.length === 0} data-testid="button-labels"><QrCode className="h-4 w-4 mr-1.5" /> Etiketten ({selected.length})</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="glass-card"><CardContent className="pt-6"><div className="text-2xl font-bold text-primary">{all.length}</div><div className="text-sm text-muted-foreground mt-1">Geräte</div></CardContent></Card>
        <Card className="glass-card"><CardContent className="pt-6"><div className="text-2xl font-bold text-primary">{formatCurrency(totalValue)}</div><div className="text-sm text-muted-foreground mt-1">Aktueller Wert</div></CardContent></Card>
        <Card className="glass-card"><CardContent className="pt-6"><div className="text-2xl font-bold text-primary">{formatCurrency(totalPurchase)}</div><div className="text-sm text-muted-foreground mt-1">Anschaffungswert</div></CardContent></Card>
        <Card className="glass-card"><CardContent className="pt-6"><div className="text-2xl font-bold text-destructive flex items-center gap-1"><TrendingDown className="h-5 w-5" />{formatCurrency(totalPurchase - totalValue)}</div><div className="text-sm text-muted-foreground mt-1">Wertverlust</div></CardContent></Card>
      </div>

      <Card className="glass-card">
        <CardHeader><CardTitle>Wert nach Kategorie</CardTitle></CardHeader>
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
            <CardTitle>Geräte & Anlagen</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Suchen..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 w-48" data-testid="input-search-inventory" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40" data-testid="select-status-filter"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="alle">Alle Status</SelectItem>
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
                <TableHead className="w-8"></TableHead><TableHead>Inv-Nr.</TableHead><TableHead>Gerät</TableHead><TableHead>Kategorie</TableHead>
                <TableHead>Entität</TableHead><TableHead>Zugewiesen</TableHead><TableHead className="text-right">Wert</TableHead><TableHead>Abschr.</TableHead><TableHead>Status</TableHead>
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
              {list.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Keine Geräte gefunden.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
