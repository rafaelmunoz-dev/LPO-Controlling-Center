import { useState } from "react";
import { useAppStore } from "@/hooks/use-app-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PageHeader, statusLabel } from "@/components/shared/page";
import { Term } from "@/components/shared/Term";
import { AiInsight } from "@/components/shared/AiInsight";
import { UploadPanel } from "@/components/shared/UploadPanel";
import { scopeByEntity, defaultFirmForView, formatCurrency, formatNumber } from "@/data";
import type { InventoryItem, EntityCode, InventoryCategory, InventoryStatus } from "@/data/types";
import { Boxes, QrCode, Search, TrendingDown, ClipboardCheck, CheckCircle2, AlertTriangle, HelpCircle, RotateCcw, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { INVENTORY_EDIT_ROLES, can } from "@/data/governance";
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

import { CHART } from "@/lib/chart";

const NAVY = CHART.navy;

type CountState = "offen" | "gezählt" | "abweichend" | "fehlt";
const COUNT_TONE: Record<CountState, string> = {
  offen: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  gezählt: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  abweichend: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  fehlt: "bg-destructive/10 text-destructive border-destructive/20",
};

const CATEGORIES: InventoryCategory[] = ["Laptop", "Monitor", "Handy", "Tablet", "Möbel", "Maschine", "Fahrzeug", "Software-Lizenz", "Sonstiges"];
const STATUSES: InventoryStatus[] = ["verfügbar", "zugewiesen", "in Reparatur", "verloren", "ausgemustert", "verkauft"];

type InvForm = Omit<InventoryItem, "id" | "purchasePrice" | "currentValue" | "depreciation"> & { purchasePrice: string; currentValue: string };
const emptyInv = (entity: EntityCode): InvForm => ({
  inventoryNumber: "", name: "", category: "Laptop", entity, location: "", assignedTo: "", condition: "Neuwertig",
  purchaseDate: new Date().toISOString().slice(0, 10), warrantyUntil: "", status: "verfügbar", purchasePrice: "", currentValue: "",
});

export default function Inventar() {
  const { t } = useTranslation();
  const { selectedEntity, currentUser, inventory, addInventoryItem, updateInventoryItem, removeInventoryItem, logAction, entities } = useAppStore();
  const canEditInv = INVENTORY_EDIT_ROLES.includes(currentUser.role);
  const canCreate = can(currentUser.role, "inventar:create");
  const canEdit = can(currentUser.role, "inventar:edit");
  const canDelete = can(currentUser.role, "inventar:delete");
  const all = scopeByEntity(inventory, selectedEntity);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("alle");
  const [selected, setSelected] = useState<string[]>([]);
  const [counts, setCounts] = useState<Record<string, CountState>>({});

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<InvForm>(emptyInv("IMP"));

  const openCreate = () => { setEditId(null); setForm(emptyInv(defaultFirmForView(selectedEntity) ?? "IMP")); setOpen(true); };
  const openEdit = (i: InventoryItem) => { setEditId(i.id); setForm({ ...i, purchasePrice: String(i.purchasePrice), currentValue: String(i.currentValue) }); setOpen(true); };
  const save = () => {
    if (editId ? !canEdit : !canCreate) { toast.error(t("no_permission")); return; }
    if (!form.name.trim() || !form.inventoryNumber.trim()) { toast.error(t("common_inv_no")); return; }
    const pp = Number(form.purchasePrice) || 0;
    const cv = Number(form.currentValue) || 0;
    const depreciation = pp > 0 ? Math.round(((pp - cv) / pp) * 100) : 0;
    const payload = { ...form, purchasePrice: pp, currentValue: cv, depreciation };
    if (editId) {
      updateInventoryItem(editId, payload);
      logAction(t("inv_edit"), `${form.name} (${form.inventoryNumber})`);
      toast.success(t("inv_edit"));
    } else {
      addInventoryItem({ ...payload, id: `INV-${Math.floor(Math.random() * 9000 + 1000)}` });
      logAction(t("inv_create"), `${form.name} (${form.inventoryNumber})`);
      toast.success(t("inv_create"));
    }
    setOpen(false);
  };
  const confirmDelete = () => {
    if (!deleteId) return;
    if (!canDelete) { toast.error(t("no_permission")); return; }
    const i = inventory.find((x) => x.id === deleteId);
    removeInventoryItem(deleteId);
    logAction(t("common_delete"), i?.name ?? deleteId);
    toast.success(t("common_delete"));
    setDeleteId(null);
  };

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
    const items = inventory.filter((i) => selected.includes(i.id));
    if (items.length === 0) { toast.error(t("toast_select_device")); return; }
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const labelW = 90, labelH = 50, marginX = 12, marginY = 14, gapY = 6;
    let x = marginX, y = marginY, col = 0;

    for (const item of items) {
      const qrData = await QRCode.toDataURL(`INV|${item.inventoryNumber}|${item.name}|${item.entity}`, { margin: 0, width: 120 });
      const canvas = document.createElement("canvas");
      JsBarcode(canvas, item.inventoryNumber, { format: "CODE128", displayValue: false, height: 40, margin: 0 });
      const barcode = canvas.toDataURL("image/png");

      doc.setDrawColor(214, 220, 230);
      doc.roundedRect(x, y, labelW, labelH, 2, 2);
      doc.setFontSize(8); doc.setTextColor(120);
      doc.text("Inventar", x + 5, y + 6);
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
    toast.success(t("toast_labels_created", { count: items.length }));
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
        actions={
          <div className="flex gap-2">
            {canCreate && <Button variant="outline" onClick={openCreate} data-testid="button-add-inventory"><Plus className="h-4 w-4 mr-1.5" /> {t("inv_create")}</Button>}
            <Button onClick={generateLabels} disabled={!canEditInv || selected.length === 0} data-testid="button-labels"><QrCode className="h-4 w-4 mr-1.5" /> {t("labels")} ({selected.length})</Button>
          </div>
        }
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
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART.grid} />
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
                      {["zugewiesen", "verfügbar", "in Reparatur", "verloren", "ausgemustert"].map((s) => <SelectItem key={s} value={s}>{statusLabel(t, s)}</SelectItem>)}
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
                    <TableHead>{t("entity")}</TableHead><TableHead>{t("inv_assigned")}</TableHead><TableHead className="text-right">{t("value")}</TableHead><TableHead>{t("inv_depreciation_short")}</TableHead><TableHead>{t("status")}</TableHead>{(canEdit || canDelete) && <TableHead className="text-right">{t("common_action")}</TableHead>}
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
                      <TableCell><Badge variant="outline" className={STATUS_TONE[i.status] ?? ""}>{statusLabel(t, i.status)}</Badge></TableCell>
                      {(canEdit || canDelete) && (
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            {canEdit && <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(i)} data-testid={`button-edit-inventory-${i.id}`}><Pencil className="h-3.5 w-3.5" /></Button>}
                            {canDelete && <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(i.id)} data-testid={`button-delete-inventory-${i.id}`}><Trash2 className="h-3.5 w-3.5" /></Button>}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {list.length === 0 && <TableRow><TableCell colSpan={canEdit || canDelete ? 10 : 9} className="text-center text-muted-foreground py-8">{t("inv_empty_devices")}</TableCell></TableRow>}
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
                <Button variant="outline" size="sm" onClick={() => { setCounts({}); toast.message(t("toast_count_reset")); }} data-testid="button-reset-count"><RotateCcw className="h-4 w-4 mr-1.5" /> {t("common_reset")}</Button>
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
                        <TableCell><Badge variant="outline" className={COUNT_TONE[st]}>{statusLabel(t, st)}</Badge></TableCell>
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
                <Button disabled={!canEditInv || countedTotal === 0} onClick={() => toast.success(t("toast_stocktake_done", { counted: countedTotal, diff: discrepancies.length }))} data-testid="button-finish-count">{t("finish_stocktaking")}</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="belege">
          <UploadPanel docTypes={["Inventurliste"]} defaultDocType="Inventurliste" />
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? t("inv_edit") : t("inv_create")}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>{t("common_inv_no")}</Label><Input value={form.inventoryNumber} onChange={(e) => setForm({ ...form, inventoryNumber: e.target.value })} data-testid="input-inventory-number" /></div>
              <div className="space-y-1.5"><Label>{t("common_device")}</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="input-inventory-name" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>{t("category")}</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as InventoryCategory })}>
                  <SelectTrigger data-testid="select-inventory-category"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>{t("entity")}</Label>
                <Select value={form.entity} onValueChange={(v) => setForm({ ...form, entity: v as EntityCode })}>
                  <SelectTrigger data-testid="select-inventory-entity"><SelectValue /></SelectTrigger>
                  <SelectContent>{entities.filter((e) => !e.archived).map((e) => <SelectItem key={e.code} value={e.code}>{e.code}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>{t("mit_location")}</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>{t("inv_assigned")}</Label><Input value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>{t("inv_purchase_price")}</Label><Input type="number" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} data-testid="input-inventory-purchase" /></div>
              <div className="space-y-1.5"><Label>{t("inv_current_value")}</Label><Input type="number" value={form.currentValue} onChange={(e) => setForm({ ...form, currentValue: e.target.value })} data-testid="input-inventory-value" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>{t("condition")}</Label><Input value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>{t("status")}</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as InventoryStatus })}>
                  <SelectTrigger data-testid="select-inventory-status"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{statusLabel(t, s)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t("cancel")}</Button>
            <Button onClick={save} data-testid="button-save-inventory">{t("common_save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{t("common_delete_confirm_title")}</AlertDialogTitle><AlertDialogDescription>{t("common_delete_confirm_desc")}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" data-testid="button-confirm-delete-inventory">{t("common_delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
