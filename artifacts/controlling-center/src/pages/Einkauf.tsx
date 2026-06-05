import { useRef, useState } from "react";
import { useAppStore } from "@/hooks/use-app-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PageHeader, StatusBadge } from "@/components/shared/page";
import { AiInsight } from "@/components/shared/AiInsight";
import { UploadPanel } from "@/components/shared/UploadPanel";
import { PurchaseRequestLifecycle } from "@/components/shared/PurchaseRequestLifecycle";
import { scopeByEntity, FORM_RESPONSES, defaultFirmForView, formatCurrency } from "@/data";
import { can, CREATE_PR_ROLES, APPROVER_ROLES } from "@/data/governance";
import type { EntityCode, PurchaseRequest, Supplier } from "@/data/types";
import { ShoppingCart, Plus, Star, CheckCircle2, XCircle, FileInput, Pencil, Trash2, Paperclip, FileText, X } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

type SupplierForm = Omit<Supplier, "id" | "rating"> & { rating: string };
const emptySupplier = (): SupplierForm => ({ name: "", category: "", country: "", rating: "4.0" });

export default function Einkauf() {
  const { t } = useTranslation();
  const { selectedEntity, purchaseRequests, addPurchaseRequest, updatePRStatus, currentUser, suppliers, addSupplier, updateSupplier, removeSupplier, logAction, entities } = useAppStore();
  const ownPRsOnly = currentUser.role === "Mitarbeiter";
  const prs = scopeByEntity(purchaseRequests, selectedEntity).filter((p) => !ownPRsOnly || p.requestedBy === currentUser.name);
  const forms = scopeByEntity(FORM_RESPONSES, selectedEntity);
  const canCreatePR = CREATE_PR_ROLES.includes(currentUser.role);
  const canApprovePR = APPROVER_ROLES.includes(currentUser.role);
  const canSupCreate = can(currentUser.role, "lieferant:create");
  const canSupEdit = can(currentUser.role, "lieferant:edit");
  const canSupDelete = can(currentUser.role, "lieferant:delete");
  const [open, setOpen] = useState(false);
  const [convertedIds, setConvertedIds] = useState<string[]>([]);
  const [form, setForm] = useState({ title: "", supplier: suppliers[0]?.name ?? "", amount: "", category: "IT-Hardware", justification: "", entity: (defaultFirmForView(selectedEntity) ?? "IMP") as EntityCode });
  const [offers, setOffers] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? [])
      .filter((f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"))
      .map((f) => f.name);
    if (picked.length === 0 && (e.target.files?.length ?? 0) > 0) toast.error(t("einkauf_offer_hint"));
    setOffers((prev) => Array.from(new Set([...prev, ...picked])));
    e.target.value = "";
  };
  const removeOffer = (name: string) => setOffers((prev) => prev.filter((n) => n !== name));

  const [supOpen, setSupOpen] = useState(false);
  const [supEditId, setSupEditId] = useState<string | null>(null);
  const [supDeleteId, setSupDeleteId] = useState<string | null>(null);
  const [supForm, setSupForm] = useState<SupplierForm>(emptySupplier());

  const openSupCreate = () => { setSupEditId(null); setSupForm(emptySupplier()); setSupOpen(true); };
  const openSupEdit = (s: Supplier) => { setSupEditId(s.id); setSupForm({ name: s.name, category: s.category, country: s.country, rating: String(s.rating) }); setSupOpen(true); };
  const saveSupplier = () => {
    if (supEditId ? !canSupEdit : !canSupCreate) { toast.error(t("no_permission")); return; }
    if (!supForm.name.trim()) { toast.error(t("name")); return; }
    const payload = { ...supForm, rating: Number(supForm.rating) || 0 };
    if (supEditId) {
      updateSupplier(supEditId, payload);
      logAction(t("sup_edit"), supForm.name);
      toast.success(t("sup_edit"));
    } else {
      addSupplier({ ...payload, id: `SUP-${Math.floor(Math.random() * 9000 + 1000)}` });
      logAction(t("sup_create"), supForm.name);
      toast.success(t("sup_create"));
    }
    setSupOpen(false);
  };
  const confirmSupDelete = () => {
    if (!supDeleteId) return;
    if (!canSupDelete) { toast.error(t("no_permission")); return; }
    const s = suppliers.find((x) => x.id === supDeleteId);
    removeSupplier(supDeleteId);
    logAction(t("common_delete"), s?.name ?? supDeleteId);
    toast.success(t("common_delete"));
    setSupDeleteId(null);
  };

  const create = () => {
    if (!canCreatePR) { toast.error(t("no_permission")); return; }
    if (!form.title.trim() || !form.amount) { toast.error(t("toast_title_amount_required")); return; }
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
      documents: offers.length ? offers : undefined,
      source: "Manuell",
    };
    addPurchaseRequest(pr);
    toast.success(t("toast_pr_submitted", { id: pr.id }));
    setOpen(false);
    setForm({ ...form, title: "", amount: "", justification: "" });
    setOffers([]);
  };

  const convertForm = (id: string) => {
    if (!canCreatePR) { toast.error(t("no_permission")); return; }
    const fr = FORM_RESPONSES.find((f) => f.id === id);
    if (!fr) return;
    if (fr.converted || convertedIds.includes(id)) { toast.error(t("toast_form_converted_already")); return; }
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
    toast.success(t("toast_form_converted", { id: pr.id }));
  };

  const volume = prs.reduce((a, p) => a + p.amount, 0);
  const open_count = prs.filter((p) => ["Eingereicht", "In Prüfung", "Entwurf"].includes(p.status)).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("einkauf")}
        subtitle={t("einkauf_subtitle")}
        icon={<ShoppingCart className="h-5 w-5" />}
        actions={
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setOffers([]); }}>
            <DialogTrigger asChild><Button disabled={!canCreatePR} data-testid="button-new-pr"><Plus className="h-4 w-4 mr-1.5" /> {t("einkauf_new_pr")}</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{t("einkauf_new_pr_title")}</DialogTitle></DialogHeader>
              <div className="space-y-3 py-2">
                <div className="space-y-1.5"><Label>{t("common_title")}</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} data-testid="input-pr-title" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>{t("supplier")}</Label>
                    <Select value={form.supplier} onValueChange={(v) => setForm({ ...form, supplier: v })}>
                      <SelectTrigger data-testid="select-supplier"><SelectValue /></SelectTrigger>
                      <SelectContent>{suppliers.map((s) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label>{t("einkauf_amount_eur")}</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} data-testid="input-pr-amount" /></div>
                  <div className="space-y-1.5"><Label>{t("category")}</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>{t("entity")}</Label>
                    <Select value={form.entity} onValueChange={(v) => setForm({ ...form, entity: v as EntityCode })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{entities.filter((e) => !e.archived).map((e) => <SelectItem key={e.code} value={e.code}>{e.code}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5"><Label>{t("common_justification")}</Label><Textarea value={form.justification} onChange={(e) => setForm({ ...form, justification: e.target.value })} data-testid="input-pr-justification" /></div>
                <div className="space-y-1.5">
                  <Label>{t("einkauf_attach_offer")}</Label>
                  <input ref={fileInputRef} type="file" accept="application/pdf" multiple className="hidden" onChange={onPickFiles} data-testid="input-pr-offer-file" />
                  <Button type="button" variant="outline" className="w-full justify-start gap-2 font-normal text-muted-foreground" onClick={() => fileInputRef.current?.click()} data-testid="button-pr-attach-offer">
                    <Paperclip className="h-4 w-4" /> {t("einkauf_select_pdf")}
                  </Button>
                  <p className="text-xs text-muted-foreground">{t("einkauf_offer_hint")}</p>
                  {offers.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {offers.map((name) => (
                        <div key={name} className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-sm" data-testid={`offer-chip-${name}`}>
                          <FileText className="h-4 w-4 shrink-0 text-primary" />
                          <span className="min-w-0 flex-1 truncate">{name}</span>
                          <button type="button" onClick={() => removeOffer(name)} className="text-muted-foreground hover:text-destructive" data-testid={`button-remove-offer-${name}`}><X className="h-3.5 w-3.5" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>{t("cancel")}</Button>
                <Button onClick={create} data-testid="button-submit-pr">{t("submit")}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="glass-card"><CardContent className="pt-6"><div className="text-2xl font-bold text-primary">{formatCurrency(volume)}</div><div className="text-sm text-muted-foreground mt-1">{t("einkauf_volume")}</div></CardContent></Card>
        <Card className="glass-card"><CardContent className="pt-6"><div className="text-2xl font-bold text-primary">{open_count}</div><div className="text-sm text-muted-foreground mt-1">{t("einkauf_open_requests")}</div></CardContent></Card>
        <Card className="glass-card"><CardContent className="pt-6"><div className="text-2xl font-bold text-primary">{suppliers.length}</div><div className="text-sm text-muted-foreground mt-1">{t("einkauf_active_suppliers")}</div></CardContent></Card>
      </div>

      <AiInsight context="einkauf" />

      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests" data-testid="tab-requests">{t("einkauf_tab_requests")}</TabsTrigger>
          <TabsTrigger value="suppliers" data-testid="tab-suppliers">{t("einkauf_tab_suppliers")}</TabsTrigger>
          <TabsTrigger value="forms" data-testid="tab-forms">{t("einkauf_tab_forms")}</TabsTrigger>
          <TabsTrigger value="belege" data-testid="tab-belege">{t("tab_uploads")}</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <Card className="glass-card">
            <CardHeader><CardTitle>{t("einkauf_tab_requests")}</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("common_id")}</TableHead><TableHead>{t("common_title")}</TableHead><TableHead>{t("supplier")}</TableHead><TableHead>{t("entity")}</TableHead>
                    <TableHead className="text-right">{t("amount")}</TableHead><TableHead>{t("einkauf_offer")}</TableHead><TableHead>{t("common_source")}</TableHead><TableHead>{t("status")}</TableHead><TableHead className="text-right">{t("common_action")}</TableHead>
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
                      <TableCell>
                        {(() => {
                          const docs = p.documents ?? (p.document ? [p.document] : []);
                          if (docs.length === 0) return <span className="text-muted-foreground text-xs">{t("einkauf_no_offer")}</span>;
                          return (
                            <span className="inline-flex items-center gap-1.5 text-xs" title={docs.join(", ")} data-testid={`pr-offer-${p.id}`}>
                              <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                              <span className="max-w-[160px] truncate">{docs[0]}</span>
                              {docs.length > 1 && <Badge variant="outline" className="text-[10px] px-1 py-0">+{docs.length - 1}</Badge>}
                            </span>
                          );
                        })()}
                      </TableCell>
                      <TableCell>{p.source === "Microsoft Forms" ? <Badge variant="outline" className="text-xs">MS Forms</Badge> : <span className="text-muted-foreground text-xs">{p.source}</span>}</TableCell>
                      <TableCell><StatusBadge status={p.status} /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          {["Eingereicht", "In Prüfung"].includes(p.status) && (
                            <>
                              <Button size="icon" variant="outline" disabled={!canApprovePR} className="h-7 w-7 text-emerald-600" onClick={() => { updatePRStatus(p.id, "Freigegeben"); toast.success(t("toast_approved", { id: p.id })); }} data-testid={`button-approve-${p.id}`}><CheckCircle2 className="h-4 w-4" /></Button>
                              <Button size="icon" variant="outline" disabled={!canApprovePR} className="h-7 w-7 text-destructive" onClick={() => { updatePRStatus(p.id, "Abgelehnt"); toast.error(t("toast_rejected", { id: p.id })); }} data-testid={`button-reject-${p.id}`}><XCircle className="h-4 w-4" /></Button>
                            </>
                          )}
                          <PurchaseRequestLifecycle pr={p} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {prs.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">{t("einkauf_empty_requests")}</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t("einkauf_tab_suppliers")}</CardTitle>
                {canSupCreate && <Button size="sm" onClick={openSupCreate} data-testid="button-add-supplier"><Plus className="h-4 w-4 mr-1.5" /> {t("sup_create")}</Button>}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>{t("name")}</TableHead><TableHead>{t("category")}</TableHead><TableHead>{t("common_country")}</TableHead><TableHead>{t("einkauf_rating")}</TableHead>{(canSupEdit || canSupDelete) && <TableHead className="text-right">{t("common_action")}</TableHead>}</TableRow></TableHeader>
                <TableBody>
                  {suppliers.map((s) => (
                    <TableRow key={s.id} data-testid={`row-supplier-${s.id}`}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.category}</TableCell>
                      <TableCell className="text-muted-foreground">{s.country}</TableCell>
                      <TableCell><span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {s.rating.toFixed(1)}</span></TableCell>
                      {(canSupEdit || canSupDelete) && (
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            {canSupEdit && <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openSupEdit(s)} data-testid={`button-edit-supplier-${s.id}`}><Pencil className="h-3.5 w-3.5" /></Button>}
                            {canSupDelete && <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setSupDeleteId(s.id)} data-testid={`button-delete-supplier-${s.id}`}><Trash2 className="h-3.5 w-3.5" /></Button>}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {suppliers.length === 0 && <TableRow><TableCell colSpan={canSupEdit || canSupDelete ? 5 : 4} className="text-center text-muted-foreground py-8">—</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forms">
          <Card className="glass-card">
            <CardHeader><CardTitle>{t("einkauf_forms_title")}</CardTitle><p className="text-sm text-muted-foreground">{t("einkauf_forms_subtitle")}</p></CardHeader>
            <CardContent className="space-y-4">
              {forms.map((fr) => (
                <div key={fr.id} className="border border-border rounded-xl p-4" data-testid={`form-${fr.id}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-medium flex items-center gap-2"><FileInput className="h-4 w-4 text-primary" /> {fr.form}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{fr.respondent} · {fr.entity} · {fr.submittedAt}</div>
                    </div>
                    {(fr.converted || convertedIds.includes(fr.id)) ? <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">{t("einkauf_converted")}</Badge>
                      : canCreatePR ? <Button size="sm" onClick={() => convertForm(fr.id)} data-testid={`button-convert-${fr.id}`}>{t("einkauf_to_pr")}</Button> : null}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                    {fr.fields.map((f, i) => (<div key={i} className="flex justify-between border-b border-dashed border-border/60 py-1"><span className="text-muted-foreground">{f.label}</span><span className="font-medium">{f.value}</span></div>))}
                  </div>
                </div>
              ))}
              {forms.length === 0 && <p className="text-center text-muted-foreground py-8">{t("einkauf_empty_forms")}</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="belege">
          <UploadPanel docTypes={["Einkaufsliste", "Lieferantenliste"]} defaultDocType="Einkaufsliste" />
        </TabsContent>
      </Tabs>

      <Dialog open={supOpen} onOpenChange={setSupOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{supEditId ? t("sup_edit") : t("sup_create")}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>{t("name")}</Label><Input value={supForm.name} onChange={(e) => setSupForm({ ...supForm, name: e.target.value })} data-testid="input-supplier-name" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>{t("category")}</Label><Input value={supForm.category} onChange={(e) => setSupForm({ ...supForm, category: e.target.value })} data-testid="input-supplier-category" /></div>
              <div className="space-y-1.5"><Label>{t("common_country")}</Label><Input value={supForm.country} onChange={(e) => setSupForm({ ...supForm, country: e.target.value })} data-testid="input-supplier-country" /></div>
            </div>
            <div className="space-y-1.5"><Label>{t("einkauf_rating")}</Label><Input type="number" step="0.1" min="0" max="5" value={supForm.rating} onChange={(e) => setSupForm({ ...supForm, rating: e.target.value })} data-testid="input-supplier-rating" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSupOpen(false)}>{t("cancel")}</Button>
            <Button onClick={saveSupplier} data-testid="button-save-supplier">{t("common_save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!supDeleteId} onOpenChange={(o) => !o && setSupDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{t("common_delete_confirm_title")}</AlertDialogTitle><AlertDialogDescription>{t("common_delete_confirm_desc")}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSupDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" data-testid="button-confirm-delete-supplier">{t("common_delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
