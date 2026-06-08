import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppStore } from "@/hooks/use-app-context";
import { getEntityComparison, DEFAULT_GROUP_ID } from "@/data";
import { ENTITY_EDIT_ROLES, ENTITY_CREATE_ROLES } from "@/data/governance";
import type { CompanyGroup, EntityMeta } from "@/data/types";
import { EntityAvatar } from "@/components/shared/EntityAvatar";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Building2, MapPin, Users, Pencil, Plus, ImageOff, Archive, ArchiveRestore, FolderPlus } from "lucide-react";
import { toast } from "sonner";

interface EntityForm {
  code: string;
  name: string;
  description: string;
  location: string;
  employees: string;
  color: string;
  groupId: string;
}

function metaToForm(e: EntityMeta): EntityForm {
  return { code: e.code, name: e.name, description: e.description, location: e.location, employees: String(e.employees), color: e.color, groupId: e.groupId };
}

const EMPTY_FORM: EntityForm = { code: "", name: "", description: "", location: "", employees: "0", color: "#0ea5e9", groupId: DEFAULT_GROUP_ID };

export function EntitySettings() {
  const { t } = useTranslation();
  const {
    entities, groups, currentUser, addEntity, updateEntity, archiveEntity, restoreEntity, setEntityLogo,
    selectedEntity, setEntity, addGroup, renameGroup, setGroupLogo, archiveGroup, restoreGroup,
  } = useAppStore();
  const comparison = getEntityComparison(entities);

  // Company groups and companies are structural — Admin-only across the board.
  const canEdit = ENTITY_EDIT_ROLES.includes(currentUser.role);
  const canCreate = ENTITY_CREATE_ROLES.includes(currentUser.role);
  const canManageGroups = canEdit;
  const canArchiveEntity = (_e: EntityMeta) => canEdit;

  const activeGroups = groups.filter((g) => !g.archived);
  const archivedGroups = groups.filter((g) => g.archived);
  // Firms archived individually (their group is still active) — restorable here.
  const archivedFirms = entities.filter((e) => e.archived && activeGroups.some((g) => g.id === e.groupId));

  const [editForm, setEditForm] = useState<EntityForm | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [createForm, setCreateForm] = useState<EntityForm>(EMPTY_FORM);
  const [createOpen, setCreateOpen] = useState(false);

  const [groupName, setGroupName] = useState("");
  const [groupCreateOpen, setGroupCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<CompanyGroup | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const openEdit = (e: EntityMeta) => { setEditForm(metaToForm(e)); setEditOpen(true); };

  const openCreate = () => {
    if (activeGroups.length === 0) { toast.error(t("ent_need_group")); return; }
    setCreateForm({ ...EMPTY_FORM, groupId: activeGroups[0].id });
    setCreateOpen(true);
  };

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
    if (!canCreate) { toast.error(t("no_permission")); return; }
    const code = createForm.code.trim().toUpperCase();
    if (!code) { toast.error(t("ent_code_required")); return; }
    if (!createForm.name.trim()) { toast.error(t("ent_name_required")); return; }
    if (entities.some((e) => e.code.toUpperCase() === code)) {
      toast.error(t("ent_code_exists"));
      return;
    }
    if (!activeGroups.some((g) => g.id === createForm.groupId)) {
      toast.error(t("ent_need_group"));
      return;
    }
    addEntity({
      code,
      name: createForm.name.trim(),
      description: createForm.description.trim(),
      location: createForm.location.trim(),
      employees: Math.max(0, parseInt(createForm.employees, 10) || 0),
      color: createForm.color,
      groupId: createForm.groupId,
    });
    setCreateOpen(false);
    setCreateForm(EMPTY_FORM);
    toast.success(t("ent_created"));
  };

  const handleArchiveEntity = (e: EntityMeta) => {
    if (!canArchiveEntity(e)) { toast.error(t("no_permission")); return; }
    archiveEntity(e.code);
    toast.success(t("ent_archived"));
  };

  const handleRestoreEntity = (e: EntityMeta) => {
    if (!canArchiveEntity(e)) { toast.error(t("no_permission")); return; }
    restoreEntity(e.code);
    toast.success(t("ent_restored"));
  };

  const saveGroup = () => {
    if (!canManageGroups) { toast.error(t("no_permission")); return; }
    if (!groupName.trim()) { toast.error(t("grp_name_required")); return; }
    addGroup(groupName.trim());
    setGroupName("");
    setGroupCreateOpen(false);
    toast.success(t("grp_created"));
  };

  const saveRename = () => {
    if (!canManageGroups || !renameTarget) { toast.error(t("no_permission")); return; }
    if (!renameValue.trim()) { toast.error(t("grp_name_required")); return; }
    renameGroup(renameTarget.id, renameValue.trim());
    setRenameTarget(null);
    toast.success(t("grp_renamed"));
  };

  const handleArchiveGroup = (g: CompanyGroup) => {
    if (!canManageGroups) { toast.error(t("no_permission")); return; }
    archiveGroup(g.id);
    toast.success(t("grp_archived"));
  };

  const handleRestoreGroup = (g: CompanyGroup) => {
    if (!canManageGroups) { toast.error(t("no_permission")); return; }
    restoreGroup(g.id);
    toast.success(t("grp_restored"));
  };

  const renderFirmCard = (e: EntityMeta) => {
    const c = comparison.find((x) => x.code === e.code);
    const active = selectedEntity === e.code;
    return (
      <div key={e.code} className={`rounded-xl border bg-muted/40 p-4 ${active ? "border-primary/40 ring-1 ring-primary/20" : "border-slate-200/80"}`} data-testid={`row-setting-entity-${e.code}`}>
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

        {(canEdit || canArchiveEntity(e)) && (
          <div className="mt-3 space-y-2 border-t border-slate-200/70 pt-3">
            {canEdit && <ImageUpload testId={`dropzone-logo-${e.code}`} onUploaded={(dataUrl) => setEntityLogo(e.code, dataUrl)} />}
            <div className="flex flex-wrap items-center gap-2">
              {canEdit && (
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openEdit(e)} data-testid={`button-edit-entity-${e.code}`}>
                  <Pencil className="h-3.5 w-3.5" /> {t("common_edit")}
                </Button>
              )}
              {canEdit && e.logo && (
                <Button size="sm" variant="ghost" className="gap-1.5 text-muted-foreground" onClick={() => { setEntityLogo(e.code, null); toast.success(t("ent_logo_removed")); }} data-testid={`button-remove-logo-${e.code}`}>
                  <ImageOff className="h-3.5 w-3.5" /> {t("ent_logo_remove")}
                </Button>
              )}
              {canEdit && (active
                ? <Badge variant="outline" className="ml-auto text-emerald-600 border-emerald-500/30 bg-emerald-500/10">{t("mit_active")}</Badge>
                : <Button size="sm" variant="ghost" className="ml-auto" onClick={() => { setEntity(e.code); toast.success(`${t("set_activate")}: ${e.name}`); }} data-testid={`button-activate-${e.code}`}>{t("set_activate")}</Button>)}
              {canArchiveEntity(e) && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="gap-1.5 text-destructive hover:text-destructive" data-testid={`button-archive-entity-${e.code}`}>
                      <Archive className="h-3.5 w-3.5" /> {t("ent_archive")}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t("ent_archive_confirm_title")}</AlertDialogTitle>
                      <AlertDialogDescription>{t("ent_archive_confirm_desc", { name: e.name })}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel data-testid={`button-archive-cancel-${e.code}`}>{t("common_cancel")}</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleArchiveEntity(e)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" data-testid={`button-archive-confirm-${e.code}`}>{t("ent_archive")}</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /> {t("set_group_structure")}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{activeGroups.length} {t("grp_groups")} · {entities.filter((e) => !e.archived).length} {t("set_group_entities")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canManageGroups && (
              <Button size="sm" variant="outline" className="gap-2" onClick={() => { setGroupName(""); setGroupCreateOpen(true); }} data-testid="button-create-group">
                <FolderPlus className="h-4 w-4" /> {t("grp_create")}
              </Button>
            )}
            {canCreate && (
              <Button size="sm" className="gap-2" onClick={openCreate} data-testid="button-create-entity"><Plus className="h-4 w-4" /> {t("ent_create")}</Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {!canEdit && !canCreate && <p className="text-sm text-muted-foreground">{t("ent_readonly_note")}</p>}

        {activeGroups.map((g) => {
          const firms = entities.filter((e) => e.groupId === g.id && !e.archived);
          return (
            <div key={g.id} className="space-y-3" data-testid={`group-section-${g.id}`}>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/70 pb-2">
                <div className="flex items-center gap-2">
                  <EntityAvatar isGroup logo={g.logo} size={28} />
                  <span className="font-semibold">{g.name}</span>
                  <Badge variant="outline" className="font-normal">{firms.length} {t("set_group_entities")}</Badge>
                </div>
                {canManageGroups && (
                  <div className="flex items-center gap-1.5">
                    <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => { setRenameTarget(g); setRenameValue(g.name); }} data-testid={`button-rename-group-${g.id}`}>
                      <Pencil className="h-3.5 w-3.5" /> {t("grp_rename")}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="gap-1.5 text-destructive hover:text-destructive" data-testid={`button-archive-group-${g.id}`}>
                          <Archive className="h-3.5 w-3.5" /> {t("grp_archive")}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t("grp_archive_confirm_title")}</AlertDialogTitle>
                          <AlertDialogDescription>{t("grp_archive_confirm_desc", { name: g.name })}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel data-testid={`button-archive-group-cancel-${g.id}`}>{t("common_cancel")}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleArchiveGroup(g)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" data-testid={`button-archive-group-confirm-${g.id}`}>{t("grp_archive")}</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
              {canManageGroups && (
                <div className="flex flex-wrap items-center gap-2">
                  <ImageUpload testId={`dropzone-group-logo-${g.id}`} hint={t("grp_logo_drop_hint")} onUploaded={(dataUrl) => setGroupLogo(g.id, dataUrl)} className="flex-1" />
                  {g.logo && (
                    <Button size="sm" variant="ghost" className="gap-1.5 text-muted-foreground" onClick={() => { setGroupLogo(g.id, null); toast.success(t("ent_logo_removed")); }} data-testid={`button-remove-group-logo-${g.id}`}>
                      <ImageOff className="h-3.5 w-3.5" /> {t("ent_logo_remove")}
                    </Button>
                  )}
                </div>
              )}
              <div className="grid gap-3 md:grid-cols-2">
                {firms.length === 0
                  ? <p className="text-sm text-muted-foreground">{t("grp_no_firms")}</p>
                  : firms.map(renderFirmCard)}
              </div>
            </div>
          );
        })}

        {(archivedGroups.length > 0 || archivedFirms.length > 0) && (
          <div className="space-y-3 rounded-xl border border-slate-200/70 bg-slate-50/60 p-4" data-testid="archive-section">
            <div className="flex items-center gap-2">
              <Archive className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold text-muted-foreground">{t("grp_archive_section")}</span>
            </div>
            {archivedGroups.map((g) => (
              <div key={g.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200/70 bg-muted/50 px-3 py-2" data-testid={`archived-group-${g.id}`}>
                <div className="flex items-center gap-2">
                  <EntityAvatar isGroup logo={g.logo} size={24} />
                  <span className="font-medium">{g.name}</span>
                  <Badge variant="outline" className="font-normal">{t("grp_label")}</Badge>
                </div>
                {canManageGroups && (
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleRestoreGroup(g)} data-testid={`button-restore-group-${g.id}`}>
                    <ArchiveRestore className="h-3.5 w-3.5" /> {t("grp_restore")}
                  </Button>
                )}
              </div>
            ))}
            {archivedFirms.map((e) => (
              <div key={e.code} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200/70 bg-muted/50 px-3 py-2" data-testid={`archived-entity-${e.code}`}>
                <div className="flex items-center gap-2">
                  <EntityAvatar entity={e} size={24} />
                  <span className="font-medium">{e.name}</span>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-semibold">{e.code}</Badge>
                </div>
                {canArchiveEntity(e) && (
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleRestoreEntity(e)} data-testid={`button-restore-entity-${e.code}`}>
                    <ArchiveRestore className="h-3.5 w-3.5" /> {t("ent_restore")}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Create firm */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("ent_create")}</DialogTitle>
            <DialogDescription>{t("ent_create_hint")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="create-code">{t("set_code")}</Label>
                <Input id="create-code" value={createForm.code} onChange={(e) => setCreateForm((f) => ({ ...f, code: e.target.value }))} placeholder={t("ent_code_placeholder")} data-testid="input-create-code" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="create-color">{t("ent_color")}</Label>
                <Input id="create-color" type="color" value={createForm.color} onChange={(e) => setCreateForm((f) => ({ ...f, color: e.target.value }))} className="h-9 p-1" data-testid="input-create-color" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t("grp_assign")}</Label>
              <Select value={createForm.groupId} onValueChange={(v) => setCreateForm((f) => ({ ...f, groupId: v }))}>
                <SelectTrigger data-testid="select-create-group"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {activeGroups.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
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

      {/* Create group */}
      <Dialog open={groupCreateOpen} onOpenChange={setGroupCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("grp_create")}</DialogTitle>
            <DialogDescription>{t("grp_create_hint")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="group-name">{t("name")}</Label>
            <Input id="group-name" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder={t("ent_group_placeholder")} data-testid="input-group-name" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGroupCreateOpen(false)} data-testid="button-group-cancel">{t("common_cancel")}</Button>
            <Button onClick={saveGroup} data-testid="button-group-save">{t("grp_create")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename group */}
      <Dialog open={!!renameTarget} onOpenChange={(o) => { if (!o) setRenameTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("grp_rename")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="rename-group">{t("name")}</Label>
            <Input id="rename-group" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} data-testid="input-rename-group" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameTarget(null)} data-testid="button-rename-cancel">{t("common_cancel")}</Button>
            <Button onClick={saveRename} data-testid="button-rename-save">{t("common_save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit firm */}
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
