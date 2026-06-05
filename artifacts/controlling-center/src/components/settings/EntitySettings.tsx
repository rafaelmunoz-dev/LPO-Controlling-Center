import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppStore } from "@/hooks/use-app-context";
import { getEntityComparison } from "@/data";
import { ENTITY_EDIT_ROLES, ENTITY_ADMIN_ROLES } from "@/data/governance";
import type { EntityMeta } from "@/data/types";
import { EntityAvatar } from "@/components/shared/EntityAvatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Building2, MapPin, Users, Pencil, Trash2, Plus, UploadCloud, ImageOff } from "lucide-react";
import { toast } from "sonner";

const MAX_LOGO_BYTES = 1_500_000;

interface EntityForm {
  code: string;
  name: string;
  description: string;
  location: string;
  employees: string;
  color: string;
}

function metaToForm(e: EntityMeta): EntityForm {
  return { code: e.code, name: e.name, description: e.description, location: e.location, employees: String(e.employees), color: e.color };
}

function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) return reject(new Error("not-image"));
    if (file.size > MAX_LOGO_BYTES) return reject(new Error("too-large"));
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("read-error"));
    reader.readAsDataURL(file);
  });
}

function LogoDropzone({ code, onUploaded }: { code: string; onUploaded: (dataUrl: string) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    try {
      const dataUrl = await readImageFile(file);
      onUploaded(dataUrl);
      toast.success(t("ent_logo_uploaded"));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "read-error";
      if (msg === "not-image") toast.error(t("ent_logo_not_image"));
      else if (msg === "too-large") toast.error(t("ent_logo_too_large"));
      else toast.error(t("ent_logo_read_error"));
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files?.[0]); }}
      className={`flex cursor-pointer items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-xs transition-colors ${dragging ? "border-primary bg-primary/5 text-primary" : "border-slate-300 text-muted-foreground hover:border-primary/50 hover:bg-white/60"}`}
      data-testid={`dropzone-logo-${code}`}
    >
      <UploadCloud className="h-4 w-4 shrink-0" />
      <span>{t("ent_logo_drop_hint")}</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ""; }}
        data-testid={`input-logo-${code}`}
      />
    </div>
  );
}

const EMPTY_FORM: EntityForm = { code: "", name: "", description: "", location: "", employees: "0", color: "#0ea5e9" };

export function EntitySettings() {
  const { t } = useTranslation();
  const { entities, currentUser, addEntity, updateEntity, removeEntity, setEntityLogo, selectedEntity, setEntity } = useAppStore();
  const comparison = getEntityComparison(entities);

  const canEdit = ENTITY_EDIT_ROLES.includes(currentUser.role);
  const canAdmin = ENTITY_ADMIN_ROLES.includes(currentUser.role);

  const [editForm, setEditForm] = useState<EntityForm | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [createForm, setCreateForm] = useState<EntityForm>(EMPTY_FORM);
  const [createOpen, setCreateOpen] = useState(false);

  const openEdit = (e: EntityMeta) => { setEditForm(metaToForm(e)); setEditOpen(true); };

  const saveEdit = () => {
    if (!canEdit) { toast.error(t("no_permission")); return; }
    if (!editForm) return;
    if (!editForm.name.trim()) { toast.error(t("ent_name_required")); return; }
    updateEntity(editForm.code, {
      name: editForm.name.trim(),
      description: editForm.description.trim(),
      location: editForm.location.trim(),
      employees: Math.max(0, parseInt(editForm.employees, 10) || 0),
      color: editForm.color,
    });
    setEditOpen(false);
    toast.success(t("ent_saved"));
  };

  const saveCreate = () => {
    if (!canAdmin) { toast.error(t("no_permission")); return; }
    const code = createForm.code.trim().toUpperCase();
    if (!code) { toast.error(t("ent_code_required")); return; }
    if (!createForm.name.trim()) { toast.error(t("ent_name_required")); return; }
    if (entities.some((e) => e.code.toUpperCase() === code) || code === "MIGU GROUP GESAMT") {
      toast.error(t("ent_code_exists"));
      return;
    }
    addEntity({
      code,
      name: createForm.name.trim(),
      description: createForm.description.trim(),
      location: createForm.location.trim(),
      employees: Math.max(0, parseInt(createForm.employees, 10) || 0),
      color: createForm.color,
    });
    setCreateOpen(false);
    setCreateForm(EMPTY_FORM);
    toast.success(t("ent_created"));
  };

  const handleDelete = (e: EntityMeta) => {
    if (!canAdmin) { toast.error(t("no_permission")); return; }
    removeEntity(e.code);
    toast.success(t("ent_deleted"));
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /> {t("set_group_structure")}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{entities.length} {t("set_group_entities")}</p>
          </div>
          {canAdmin && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2" data-testid="button-create-entity"><Plus className="h-4 w-4" /> {t("ent_create")}</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("ent_create")}</DialogTitle>
                  <DialogDescription>{t("ent_create_hint")}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="create-code">{t("set_code")}</Label>
                      <Input id="create-code" value={createForm.code} onChange={(e) => setCreateForm((f) => ({ ...f, code: e.target.value }))} placeholder="z.B. LOG" data-testid="input-create-code" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="create-color">{t("ent_color")}</Label>
                      <Input id="create-color" type="color" value={createForm.color} onChange={(e) => setCreateForm((f) => ({ ...f, color: e.target.value }))} className="h-9 p-1" data-testid="input-create-color" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="create-name">{t("name")}</Label>
                    <Input id="create-name" value={createForm.name} onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))} data-testid="input-create-name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="create-desc">{t("ent_description")}</Label>
                    <Textarea id="create-desc" rows={2} value={createForm.description} onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))} data-testid="input-create-desc" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="create-loc">{t("mit_location")}</Label>
                      <Input id="create-loc" value={createForm.location} onChange={(e) => setCreateForm((f) => ({ ...f, location: e.target.value }))} data-testid="input-create-loc" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="create-emp">{t("mit_employees")}</Label>
                      <Input id="create-emp" type="number" min={0} value={createForm.employees} onChange={(e) => setCreateForm((f) => ({ ...f, employees: e.target.value }))} data-testid="input-create-emp" />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateOpen(false)} data-testid="button-create-cancel">{t("common_cancel")}</Button>
                  <Button onClick={saveCreate} data-testid="button-create-save">{t("ent_create")}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!canEdit && <p className="mb-4 text-sm text-muted-foreground">{t("ent_readonly_note")}</p>}
        <div className="grid gap-3 md:grid-cols-2">
          {entities.map((e) => {
            const c = comparison.find((x) => x.code === e.code);
            const active = selectedEntity === e.code;
            return (
              <div key={e.code} className={`rounded-xl border bg-white/50 p-4 ${active ? "border-primary/40 ring-1 ring-primary/20" : "border-slate-200/80"}`} data-testid={`row-setting-entity-${e.code}`}>
                <div className="flex items-start gap-3">
                  <EntityAvatar entity={e} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{e.name}</span>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-semibold shrink-0">{e.code}</Badge>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{e.description}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {e.location || "—"}</span>
                      <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {e.employees}</span>
                      {c && <Badge variant="outline" className="font-normal">{c.riskLevel}</Badge>}
                    </div>
                  </div>
                </div>

                {canEdit && (
                  <div className="mt-3 space-y-2 border-t border-slate-200/70 pt-3">
                    <LogoDropzone code={e.code} onUploaded={(dataUrl) => setEntityLogo(e.code, dataUrl)} />
                    <div className="flex flex-wrap items-center gap-2">
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openEdit(e)} data-testid={`button-edit-entity-${e.code}`}>
                        <Pencil className="h-3.5 w-3.5" /> {t("common_edit")}
                      </Button>
                      {e.logo && (
                        <Button size="sm" variant="ghost" className="gap-1.5 text-muted-foreground" onClick={() => { setEntityLogo(e.code, null); toast.success(t("ent_logo_removed")); }} data-testid={`button-remove-logo-${e.code}`}>
                          <ImageOff className="h-3.5 w-3.5" /> {t("ent_logo_remove")}
                        </Button>
                      )}
                      {active
                        ? <Badge variant="outline" className="ml-auto text-emerald-600 border-emerald-500/30 bg-emerald-500/10">{t("mit_active")}</Badge>
                        : <Button size="sm" variant="ghost" className="ml-auto" onClick={() => { setEntity(e.code); toast.success(`${t("set_activate")}: ${e.name}`); }} data-testid={`button-activate-${e.code}`}>{t("set_activate")}</Button>}
                      {canAdmin && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="gap-1.5 text-destructive hover:text-destructive" data-testid={`button-delete-entity-${e.code}`}>
                              <Trash2 className="h-3.5 w-3.5" /> {t("common_delete")}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t("ent_delete_confirm_title")}</AlertDialogTitle>
                              <AlertDialogDescription>{t("ent_delete_confirm_desc", { name: e.name })}</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel data-testid={`button-delete-cancel-${e.code}`}>{t("common_cancel")}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(e)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" data-testid={`button-delete-confirm-${e.code}`}>{t("common_delete")}</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("ent_edit")}</DialogTitle>
            <DialogDescription>{editForm?.code}</DialogDescription>
          </DialogHeader>
          {editForm && (
            <div className="grid gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-name">{t("name")}</Label>
                <Input id="edit-name" value={editForm.name} onChange={(e) => setEditForm((f) => f && ({ ...f, name: e.target.value }))} data-testid="input-edit-name" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-desc">{t("ent_description")}</Label>
                <Textarea id="edit-desc" rows={2} value={editForm.description} onChange={(e) => setEditForm((f) => f && ({ ...f, description: e.target.value }))} data-testid="input-edit-desc" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-loc">{t("mit_location")}</Label>
                  <Input id="edit-loc" value={editForm.location} onChange={(e) => setEditForm((f) => f && ({ ...f, location: e.target.value }))} data-testid="input-edit-loc" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-emp">{t("mit_employees")}</Label>
                  <Input id="edit-emp" type="number" min={0} value={editForm.employees} onChange={(e) => setEditForm((f) => f && ({ ...f, employees: e.target.value }))} data-testid="input-edit-emp" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-color">{t("ent_color")}</Label>
                <Input id="edit-color" type="color" value={editForm.color} onChange={(e) => setEditForm((f) => f && ({ ...f, color: e.target.value }))} className="h-9 w-20 p-1" data-testid="input-edit-color" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} data-testid="button-edit-cancel">{t("common_cancel")}</Button>
            <Button onClick={saveEdit} data-testid="button-edit-save">{t("common_save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
