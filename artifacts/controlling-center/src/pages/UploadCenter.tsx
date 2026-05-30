import { useState } from "react";
import { useAppStore } from "@/hooks/use-app-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader, StatusBadge } from "@/components/shared/page";
import { scopeByEntity, ENTITY_CODES, formatNumber } from "@/data";
import type { DocType, EntityCode, UploadItem } from "@/data/types";
import { UploadCloud, FileText, FileSpreadsheet, File, CheckCircle2, Plus } from "lucide-react";
import { toast } from "sonner";

const DOC_TYPES: DocType[] = ["Monatsbericht", "Einkaufsliste", "Inventurliste", "Rechnungsliste", "Bankübersicht", "Budgetdatei", "Lieferantenliste", "Mitarbeiterliste"];
const FORMATS: UploadItem["format"][] = ["Excel", "CSV", "PDF", "Word", "Bild"];

function FormatIcon({ format }: { format: string }) {
  if (format === "PDF") return <FileText className="h-4 w-4 text-red-500" />;
  if (format === "Excel" || format === "CSV") return <FileSpreadsheet className="h-4 w-4 text-emerald-600" />;
  return <File className="h-4 w-4 text-blue-500" />;
}

export default function UploadCenter() {
  const { selectedEntity, uploads, addUpload, updateUploadStatus } = useAppStore();
  const list = scopeByEntity(uploads, selectedEntity);
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [docType, setDocType] = useState<DocType>("Monatsbericht");
  const [entity, setEntity] = useState<EntityCode>(selectedEntity === "MiGu Group Gesamt" ? "IMP" : selectedEntity);
  const [format, setFormat] = useState<UploadItem["format"]>("Excel");
  const [period, setPeriod] = useState("2026-05");

  const submit = () => {
    if (!fileName.trim()) {
      toast.error("Bitte einen Dateinamen angeben.");
      return;
    }
    const item: UploadItem = {
      id: `U-${Math.floor(Math.random() * 900 + 100)}`,
      fileName: fileName.includes(".") ? fileName : `${fileName}.${format.toLowerCase()}`,
      docType,
      entity,
      period,
      format,
      status: "Neu",
      uploadedBy: useAppStore.getState().currentUser.name,
      uploadedAt: new Date().toISOString().slice(0, 10),
      sizeKb: Math.floor(Math.random() * 900 + 80),
    };
    addUpload(item);
    toast.success(`${item.fileName} hochgeladen. Status: Neu.`);
    setOpen(false);
    setFileName("");
  };

  const counts = {
    total: list.length,
    pending: list.filter((u) => u.status === "Neu" || u.status === "In Prüfung").length,
    errors: list.filter((u) => u.status === "Fehler").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Upload Center"
        subtitle="Dokumente & Datenimport"
        icon={<UploadCloud className="h-5 w-5" />}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-upload"><Plus className="h-4 w-4 mr-1.5" /> Dokument hochladen</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Dokument hochladen</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center text-sm text-muted-foreground">
                  <UploadCloud className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
                  Datei hierher ziehen oder Namen unten eingeben (Demo)
                </div>
                <div className="space-y-1.5">
                  <Label>Dateiname</Label>
                  <Input value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="z.B. Monatsbericht_Mai" data-testid="input-filename" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Dokumenttyp</Label>
                    <Select value={docType} onValueChange={(v) => setDocType(v as DocType)}>
                      <SelectTrigger data-testid="select-doctype"><SelectValue /></SelectTrigger>
                      <SelectContent>{DOC_TYPES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Entität</Label>
                    <Select value={entity} onValueChange={(v) => setEntity(v as EntityCode)}>
                      <SelectTrigger data-testid="select-entity"><SelectValue /></SelectTrigger>
                      <SelectContent>{ENTITY_CODES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Format</Label>
                    <Select value={format} onValueChange={(v) => setFormat(v as UploadItem["format"])}>
                      <SelectTrigger data-testid="select-format"><SelectValue /></SelectTrigger>
                      <SelectContent>{FORMATS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Zeitraum</Label>
                    <Input value={period} onChange={(e) => setPeriod(e.target.value)} data-testid="input-period" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button>
                <Button onClick={submit} data-testid="button-submit-upload">Hochladen</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Dokumente gesamt", value: counts.total },
          { label: "Verarbeitet", value: list.filter((u) => u.status === "Verarbeitet").length },
          { label: "Offen / In Prüfung", value: counts.pending },
          { label: "Fehler", value: counts.errors },
        ].map((s) => (
          <Card key={s.label} className="glass-card">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-primary">{s.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass-card">
        <CardHeader><CardTitle>Hochgeladene Dokumente</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datei</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Entität</TableHead>
                <TableHead>Zeitraum</TableHead>
                <TableHead>Größe</TableHead>
                <TableHead>Hochgeladen von</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aktion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((u) => (
                <TableRow key={u.id} data-testid={`row-upload-${u.id}`}>
                  <TableCell className="font-medium flex items-center gap-2"><FormatIcon format={u.format} /> {u.fileName}</TableCell>
                  <TableCell>{u.docType}</TableCell>
                  <TableCell>{u.entity}</TableCell>
                  <TableCell className="text-muted-foreground">{u.period}</TableCell>
                  <TableCell className="text-muted-foreground">{formatNumber(u.sizeKb)} KB</TableCell>
                  <TableCell>{u.uploadedBy}</TableCell>
                  <TableCell><StatusBadge status={u.status} /></TableCell>
                  <TableCell className="text-right">
                    {u.status !== "Verarbeitet" && u.status !== "Archiviert" && (
                      <Button size="sm" variant="outline" onClick={() => { updateUploadStatus(u.id, "Verarbeitet"); toast.success(`${u.fileName} verarbeitet.`); }} data-testid={`button-process-${u.id}`}>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Verarbeiten
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {list.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Keine Dokumente für diese Entität.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
