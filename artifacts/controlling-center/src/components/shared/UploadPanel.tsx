import { useState } from "react";
import { UploadCloud, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAppStore } from "@/hooks/use-app-context";
import { UPLOAD_ROLES, UPLOAD_PROCESS_ROLES } from "@/data/governance";
import { defaultFirmForView, scopeByEntity, formatDate } from "@/data";
import type { DocType, EntityCode, UploadItem } from "@/data/types";
import { StatusBadge } from "@/components/shared/page";

interface Props {
  title?: string;
  docTypes: DocType[];
  defaultDocType: DocType;
}

export function UploadPanel({ title, docTypes, defaultDocType }: Props) {
  const { t } = useTranslation();
  const { uploads, addUpload, updateUploadStatus, selectedEntity, currentUser, entities } = useAppStore();
  const canUpload = UPLOAD_ROLES.includes(currentUser.role);
  const canProcess = UPLOAD_PROCESS_ROLES.includes(currentUser.role);
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [docType, setDocType] = useState<DocType>(defaultDocType);
  const [entity, setEntity] = useState<EntityCode>(
    defaultFirmForView(selectedEntity) ?? "IMP"
  );
  const [format, setFormat] = useState<UploadItem["format"]>("Excel");
  const [period, setPeriod] = useState("2026-05");

  const relevant = scopeByEntity(
    uploads.filter((u) => docTypes.includes(u.docType)),
    selectedEntity
  );

  const submit = () => {
    if (!canUpload) {
      toast.error(t("no_permission"));
      return;
    }
    if (!fileName.trim()) {
      toast.error(t("file_name"));
      return;
    }
    const item: UploadItem = {
      id: `U-${Date.now()}`,
      fileName: fileName.includes(".") ? fileName : `${fileName}.${format === "Excel" ? "xlsx" : format.toLowerCase()}`,
      docType,
      entity,
      period,
      format,
      status: "Neu",
      uploadedBy: currentUser.name,
      uploadedAt: new Date().toISOString().slice(0, 10),
      sizeKb: Math.round(50 + Math.random() * 900),
    };
    addUpload(item);
    toast.success(`${item.fileName} · ${t("upload_document")}`);
    setOpen(false);
    setFileName("");
  };

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 text-primary p-1.5">
            <UploadCloud className="h-4 w-4" />
          </div>
          <span className="font-semibold text-primary">{title ?? t("upload_documents")}</span>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          {canUpload && (
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5" data-testid="button-upload-open">
                <UploadCloud className="h-4 w-4" />
                {t("upload_document")}
              </Button>
            </DialogTrigger>
          )}
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("upload_document")}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-1.5">
                <Label>{t("file_name")}</Label>
                <Input value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="Monatsbericht_Mai" data-testid="input-upload-name" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>{t("type")}</Label>
                  <Select value={docType} onValueChange={(v) => setDocType(v as DocType)}>
                    <SelectTrigger data-testid="select-upload-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {docTypes.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>{t("entity")}</Label>
                  <Select value={entity} onValueChange={(v) => setEntity(v as EntityCode)}>
                    <SelectTrigger data-testid="select-upload-entity"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {entities.filter((e) => !e.archived).map((e) => <SelectItem key={e.code} value={e.code}>{e.code}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>{t("period")}</Label>
                  <Input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="2026-05" />
                </div>
                <div className="grid gap-1.5">
                  <Label>Format</Label>
                  <Select value={format} onValueChange={(v) => setFormat(v as UploadItem["format"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Excel", "CSV", "PDF", "Word", "Bild"].map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>{t("cancel")}</Button>
              <Button onClick={submit} data-testid="button-upload-submit">{t("upload_document")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {relevant.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">{t("no_uploads")}</p>
      ) : (
        <div className="space-y-2">
          {relevant.slice(0, 6).map((u) => (
            <div key={u.id} className="flex items-center gap-3 rounded-xl border border-slate-200/70 bg-white/60 p-2.5">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{u.fileName}</p>
                <p className="text-xs text-muted-foreground">{u.entity} · {u.period} · {formatDate(u.uploadedAt)}</p>
              </div>
              <StatusBadge status={u.status} />
              {canProcess && (u.status === "Neu" || u.status === "Fehler") && (
                <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => { if (!canProcess) { toast.error(t("no_permission")); return; } updateUploadStatus(u.id, "Verarbeitet"); toast.success(t("process")); }} data-testid={`button-process-${u.id}`}>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {t("process")}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
