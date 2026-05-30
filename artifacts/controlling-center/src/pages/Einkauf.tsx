import { useState } from "react";
import { useAppStore } from "@/hooks/use-app-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PageHeader, StatusBadge } from "@/components/shared/page";
import { scopeByEntity, SUPPLIERS, FORM_RESPONSES, ENTITY_CODES, formatCurrency } from "@/data";
import type { EntityCode, PurchaseRequest } from "@/data/types";
import { ShoppingCart, Plus, Star, CheckCircle2, XCircle, FileInput } from "lucide-react";
import { toast } from "sonner";

export default function Einkauf() {
  const { selectedEntity, purchaseRequests, addPurchaseRequest, updatePRStatus, currentUser } = useAppStore();
  const prs = scopeByEntity(purchaseRequests, selectedEntity);
  const forms = scopeByEntity(FORM_RESPONSES, selectedEntity);
  const [open, setOpen] = useState(false);
  const [convertedIds, setConvertedIds] = useState<string[]>([]);
  const [form, setForm] = useState({ title: "", supplier: SUPPLIERS[0].name, amount: "", category: "IT-Hardware", justification: "", entity: (selectedEntity === "MiGu Group Gesamt" ? "IMP" : selectedEntity) as EntityCode });

  const create = () => {
    if (!form.title.trim() || !form.amount) { toast.error("Bitte Titel und Betrag angeben."); return; }
    const pr: PurchaseRequest = {
      id: `PR-${Math.floor(Math.random() * 9000 + 1000)}`,
      title: form.title,
      supplier: form.supplier,
      amount: Number(form.amount),
      entity: form.entity,
      category: form.category,
      justification: form.justification,
      status: "Eingereicht",
      requestedBy: currentUser.name,
      createdAt: new Date().toISOString().slice(0, 10),
      source: "Manuell",
    };
    addPurchaseRequest(pr);
    toast.success(`Kaufanfrage ${pr.id} eingereicht.`);
    setOpen(false);
    setForm({ ...form, title: "", amount: "", justification: "" });
  };

  const convertForm = (id: string) => {
    const fr = FORM_RESPONSES.find((f) => f.id === id);
    if (!fr) return;
    if (fr.converted || convertedIds.includes(id)) { toast.error("Formular wurde bereits umgewandelt."); return; }
    const pr: PurchaseRequest = {
      id: `PR-${Math.floor(Math.random() * 9000 + 1000)}`,
      title: fr.fields[0]?.value ?? fr.form,
      supplier: fr.fields.find((f) => /lieferant/i.test(f.label))?.value ?? "Unbekannt",
      amount: Number((fr.fields.find((f) => /kosten|betrag/i.test(f.label))?.value ?? "0").replace(/[^\d]/g, "")) || 0,
      entity: fr.entity,
      category: "Aus Formular",
      justification: fr.fields.find((f) => /begründung/i.test(f.label))?.value ?? "",
      status: "Eingereicht",
      requestedBy: fr.respondent,
      createdAt: new Date().toISOString().slice(0, 10),
      source: "Microsoft Forms",
    };
    addPurchaseRequest(pr);
    setConvertedIds((ids) => [...ids, id]);
    toast.success(`Formular in Kaufanfrage ${pr.id} umgewandelt.`);
  };

  const volume = prs.reduce((a, p) => a + p.amount, 0);
  const open_count = prs.filter((p) => ["Eingereicht", "In Prüfung", "Entwurf"].includes(p.status)).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Einkauf"
        subtitle="Beschaffung & Lieferanten"
        icon={<ShoppingCart className="h-5 w-5" />}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button data-testid="button-new-pr"><Plus className="h-4 w-4 mr-1.5" /> Kaufanfrage</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Neue Kaufanfrage</DialogTitle></DialogHeader>
              <div className="space-y-3 py-2">
                <div className="space-y-1.5"><Label>Titel</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} data-testid="input-pr-title" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Lieferant</Label>
                    <Select value={form.supplier} onValueChange={(v) => setForm({ ...form, supplier: v })}>
                      <SelectTrigger data-testid="select-supplier"><SelectValue /></SelectTrigger>
                      <SelectContent>{SUPPLIERS.map((s) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label>Betrag (€)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} data-testid="input-pr-amount" /></div>
                  <div className="space-y-1.5"><Label>Kategorie</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>Entität</Label>
                    <Select value={form.entity} onValueChange={(v) => setForm({ ...form, entity: v as EntityCode })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{ENTITY_CODES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5"><Label>Begründung</Label><Textarea value={form.justification} onChange={(e) => setForm({ ...form, justification: e.target.value })} data-testid="input-pr-justification" /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button>
                <Button onClick={create} data-testid="button-submit-pr">Einreichen</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="glass-card"><CardContent className="pt-6"><div className="text-2xl font-bold text-primary">{formatCurrency(volume)}</div><div className="text-sm text-muted-foreground mt-1">Beschaffungsvolumen</div></CardContent></Card>
        <Card className="glass-card"><CardContent className="pt-6"><div className="text-2xl font-bold text-primary">{open_count}</div><div className="text-sm text-muted-foreground mt-1">Offene Anträge</div></CardContent></Card>
        <Card className="glass-card"><CardContent className="pt-6"><div className="text-2xl font-bold text-primary">{SUPPLIERS.length}</div><div className="text-sm text-muted-foreground mt-1">Aktive Lieferanten</div></CardContent></Card>
      </div>

      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests" data-testid="tab-requests">Kaufanfragen</TabsTrigger>
          <TabsTrigger value="suppliers" data-testid="tab-suppliers">Lieferanten</TabsTrigger>
          <TabsTrigger value="forms" data-testid="tab-forms">Formular-Eingänge</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <Card className="glass-card">
            <CardHeader><CardTitle>Kaufanfragen</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead><TableHead>Titel</TableHead><TableHead>Lieferant</TableHead><TableHead>Entität</TableHead>
                    <TableHead className="text-right">Betrag</TableHead><TableHead>Quelle</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aktion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prs.map((p) => (
                    <TableRow key={p.id} data-testid={`row-pr-${p.id}`}>
                      <TableCell className="font-mono text-xs">{p.id}</TableCell>
                      <TableCell className="font-medium">{p.title}</TableCell>
                      <TableCell>{p.supplier}</TableCell>
                      <TableCell>{p.entity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(p.amount)}</TableCell>
                      <TableCell>{p.source === "Microsoft Forms" ? <Badge variant="outline" className="text-xs">MS Forms</Badge> : <span className="text-muted-foreground text-xs">Manuell</span>}</TableCell>
                      <TableCell><StatusBadge status={p.status} /></TableCell>
                      <TableCell className="text-right">
                        {["Eingereicht", "In Prüfung"].includes(p.status) && (
                          <div className="flex gap-1 justify-end">
                            <Button size="icon" variant="outline" className="h-7 w-7 text-emerald-600" onClick={() => { updatePRStatus(p.id, "Freigegeben"); toast.success(`${p.id} freigegeben.`); }} data-testid={`button-approve-${p.id}`}><CheckCircle2 className="h-4 w-4" /></Button>
                            <Button size="icon" variant="outline" className="h-7 w-7 text-destructive" onClick={() => { updatePRStatus(p.id, "Abgelehnt"); toast.error(`${p.id} abgelehnt.`); }} data-testid={`button-reject-${p.id}`}><XCircle className="h-4 w-4" /></Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {prs.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Keine Kaufanfragen.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers">
          <Card className="glass-card">
            <CardHeader><CardTitle>Lieferanten</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Kategorie</TableHead><TableHead>Land</TableHead><TableHead>Bewertung</TableHead></TableRow></TableHeader>
                <TableBody>
                  {SUPPLIERS.map((s) => (
                    <TableRow key={s.id} data-testid={`row-supplier-${s.id}`}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.category}</TableCell>
                      <TableCell className="text-muted-foreground">{s.country}</TableCell>
                      <TableCell><span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {s.rating.toFixed(1)}</span></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forms">
          <Card className="glass-card">
            <CardHeader><CardTitle>Microsoft Forms Eingänge</CardTitle><p className="text-sm text-muted-foreground">Formularantworten in Kaufanfragen umwandeln.</p></CardHeader>
            <CardContent className="space-y-4">
              {forms.map((fr) => (
                <div key={fr.id} className="border border-border rounded-xl p-4" data-testid={`form-${fr.id}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-medium flex items-center gap-2"><FileInput className="h-4 w-4 text-primary" /> {fr.form}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{fr.respondent} · {fr.entity} · {fr.submittedAt}</div>
                    </div>
                    {(fr.converted || convertedIds.includes(fr.id)) ? <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Umgewandelt</Badge>
                      : <Button size="sm" onClick={() => convertForm(fr.id)} data-testid={`button-convert-${fr.id}`}>In Kaufanfrage</Button>}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                    {fr.fields.map((f, i) => (<div key={i} className="flex justify-between border-b border-dashed border-border/60 py-1"><span className="text-muted-foreground">{f.label}</span><span className="font-medium">{f.value}</span></div>))}
                  </div>
                </div>
              ))}
              {forms.length === 0 && <p className="text-center text-muted-foreground py-8">Keine Formular-Eingänge.</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
