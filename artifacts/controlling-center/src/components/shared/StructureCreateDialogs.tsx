import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAppStore } from "@/hooks/use-app-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/shared/ImageUpload";

interface EntityForm {
  code: string;
  name: string;
  description: string;
  location: string;
  employees: string;
  color: string;
  groupId: string;
}

const EMPTY_FORM: EntityForm = {
  code: "",
  name: "",
  description: "",
  location: "",
  employees: "0",
  color: "#0ea5e9",
  groupId: "",
};

interface Props {
  groupOpen: boolean;
  onGroupOpenChange: (open: boolean) => void;
  entityOpen: boolean;
  onEntityOpenChange: (open: boolean) => void;
}

// Shared "quick create" dialogs for company groups and companies, used by the
// Topbar entity switcher (Admin only). Mirrors the create flow in
// Einstellungen ▸ Entitäten so both surfaces behave identically.
export function StructureCreateDialogs({
  groupOpen,
  onGroupOpenChange,
  entityOpen,
  onEntityOpenChange,
}: Props) {
  const { t } = useTranslation();
  const { groups, entities, addGroup, setGroupLogo, addEntity, setEntityLogo } = useAppStore();
  const activeGroups = groups.filter((g) => !g.archived);

  const [groupName, setGroupName] = useState("");
  const [groupLogo, setLocalGroupLogo] = useState<string | null>(null);

  const [form, setForm] = useState<EntityForm>(EMPTY_FORM);
  const [entityLogo, setLocalEntityLogo] = useState<string | null>(null);

  const resetGroup = () => {
    setGroupName("");
    setLocalGroupLogo(null);
  };

  const resetEntity = () => {
    setForm(EMPTY_FORM);
    setLocalEntityLogo(null);
  };

  const handleGroupOpenChange = (open: boolean) => {
    if (!open) resetGroup();
    onGroupOpenChange(open);
  };

  const handleEntityOpenChange = (open: boolean) => {
    if (open) {
      setForm({ ...EMPTY_FORM, groupId: activeGroups[0]?.id ?? "" });
      setLocalEntityLogo(null);
    } else {
      resetEntity();
    }
    onEntityOpenChange(open);
  };

  const saveGroup = () => {
    if (!groupName.trim()) {
      toast.error(t("grp_name_required"));
      return;
    }
    const id = addGroup(groupName.trim());
    if (groupLogo) setGroupLogo(id, groupLogo);
    resetGroup();
    onGroupOpenChange(false);
    toast.success(t("grp_created"));
  };

  const saveEntity = () => {
    const code = form.code.trim().toUpperCase();
    if (!code) {
      toast.error(t("ent_code_required"));
      return;
    }
    if (!form.name.trim()) {
      toast.error(t("ent_name_required"));
      return;
    }
    if (entities.some((e) => e.code.toUpperCase() === code)) {
      toast.error(t("ent_code_exists"));
      return;
    }
    if (!activeGroups.some((g) => g.id === form.groupId)) {
      toast.error(t("ent_need_group"));
      return;
    }
    addEntity({
      code,
      name: form.name.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      employees: Math.max(0, parseInt(form.employees, 10) || 0),
      color: form.color,
      groupId: form.groupId,
    });
    if (entityLogo) setEntityLogo(code, entityLogo);
    resetEntity();
    onEntityOpenChange(false);
    toast.success(t("ent_created"));
  };

  return (
    <>
      {/* Create group */}
      <Dialog open={groupOpen} onOpenChange={handleGroupOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("grp_create")}</DialogTitle>
            <DialogDescription>{t("grp_create_hint")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="qc-group-name">{t("name")}</Label>
              <Input
                id="qc-group-name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder={t("ent_group_placeholder")}
                data-testid="input-qc-group-name"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("onb_group_logo_label")}</Label>
              <ImageUpload
                testId="dropzone-qc-group-logo"
                hint={t("grp_logo_drop_hint")}
                onUploaded={(dataUrl) => setLocalGroupLogo(dataUrl)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleGroupOpenChange(false)} data-testid="button-qc-group-cancel">
              {t("common_cancel")}
            </Button>
            <Button onClick={saveGroup} data-testid="button-qc-group-save">
              {t("grp_create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create company */}
      <Dialog open={entityOpen} onOpenChange={handleEntityOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("ent_create")}</DialogTitle>
            <DialogDescription>{t("ent_create_hint")}</DialogDescription>
          </DialogHeader>
          {activeGroups.length === 0 ? (
            <p className="text-sm text-muted-foreground" data-testid="text-qc-need-group">
              {t("ent_need_group")}
            </p>
          ) : (
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="qc-code">{t("set_code")}</Label>
                  <Input
                    id="qc-code"
                    value={form.code}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                    placeholder={t("ent_code_placeholder")}
                    data-testid="input-qc-code"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="qc-color">{t("ent_color")}</Label>
                  <Input
                    id="qc-color"
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                    className="h-9 p-1"
                    data-testid="input-qc-color"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>{t("grp_assign")}</Label>
                <Select value={form.groupId} onValueChange={(v) => setForm((f) => ({ ...f, groupId: v }))}>
                  <SelectTrigger data-testid="select-qc-group">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {activeGroups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="qc-name">{t("name")}</Label>
                <Input
                  id="qc-name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  data-testid="input-qc-name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="qc-desc">{t("ent_description")}</Label>
                <Textarea
                  id="qc-desc"
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  data-testid="input-qc-desc"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="qc-loc">{t("mit_location")}</Label>
                  <Input
                    id="qc-loc"
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    data-testid="input-qc-loc"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="qc-emp">{t("mit_employees")}</Label>
                  <Input
                    id="qc-emp"
                    type="number"
                    min={0}
                    value={form.employees}
                    onChange={(e) => setForm((f) => ({ ...f, employees: e.target.value }))}
                    data-testid="input-qc-emp"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>{t("onb_sub_logo_hint")}</Label>
                <ImageUpload
                  testId="dropzone-qc-entity-logo"
                  onUploaded={(dataUrl) => setLocalEntityLogo(dataUrl)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => handleEntityOpenChange(false)} data-testid="button-qc-entity-cancel">
              {t("common_cancel")}
            </Button>
            {activeGroups.length === 0 ? (
              <Button
                onClick={() => {
                  handleEntityOpenChange(false);
                  onGroupOpenChange(true);
                }}
                data-testid="button-qc-entity-needgroup"
              >
                {t("grp_create")}
              </Button>
            ) : (
              <Button onClick={saveEntity} data-testid="button-qc-entity-save">
                {t("ent_create")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
