import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppStore } from "@/hooks/use-app-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  getMicrosoftStatus,
  listMicrosoftFormFiles,
  getMicrosoftFormResponses,
  type MsFormFile,
  type MsFormResponse,
} from "@/lib/api";
import { defaultFirmForView } from "@/data";
import { CREATE_PR_ROLES } from "@/data/governance";
import type { EntityCode, PurchaseRequest } from "@/data/types";
import { FileInput, RefreshCw, Plug, Loader2 } from "lucide-react";
import { toast } from "sonner";

// Maps a Microsoft Forms response row into a purchase request, using header
// heuristics (supplier / cost / justification) consistent with the manual flow.
function toPurchaseRequest(
  fr: MsFormResponse,
  entity: EntityCode,
  requestedBy: string,
): PurchaseRequest {
  const find = (re: RegExp) => fr.fields.find((f) => re.test(f.label))?.value;
  const amountRaw = find(/kosten|betrag|cost|amount|preis|price/i) ?? "0";
  return {
    id: `PR-${Math.floor(Math.random() * 9000 + 1000)}`,
    title: fr.fields[0]?.value || fr.form,
    supplier: find(/lieferant|supplier|anbieter|vendor/i) ?? "—",
    amount: Number(amountRaw.replace(/[^\d]/g, "")) || 0,
    entity,
    category: "Microsoft Forms",
    justification: find(/begründung|grund|justification|reason|zweck/i) ?? "",
    status: "Eingereicht",
    requestedBy: fr.respondent && fr.respondent !== "—" ? fr.respondent : requestedBy,
    createdAt: new Date().toISOString().slice(0, 10),
    source: "Microsoft Forms",
  };
}

export function MsFormsImport() {
  const { t } = useTranslation();
  const { selectedEntity, addPurchaseRequest, currentUser, logAction } = useAppStore();
  const canCreatePR = CREATE_PR_ROLES.includes(currentUser.role);

  const [status, setStatus] = useState<"loading" | "connected" | "disconnected">("loading");
  const [files, setFiles] = useState<MsFormFile[]>([]);
  const [fileId, setFileId] = useState<string>("");
  const [responses, setResponses] = useState<MsFormResponse[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [imported, setImported] = useState<string[]>([]);

  const loadFiles = useCallback(async () => {
    setLoadingFiles(true);
    try {
      const { files: f } = await listMicrosoftFormFiles();
      setFiles(f);
      setStatus("connected");
    } catch {
      setStatus("disconnected");
    } finally {
      setLoadingFiles(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    getMicrosoftStatus()
      .then((s) => {
        if (!active) return;
        if (s.connected) {
          loadFiles();
        } else {
          setStatus("disconnected");
        }
      })
      .catch(() => active && setStatus("disconnected"));
    return () => {
      active = false;
    };
  }, [loadFiles]);

  const loadResponses = useCallback(async (id: string) => {
    const file = files.find((f) => f.id === id);
    if (!file) return;
    setLoadingResponses(true);
    setResponses([]);
    try {
      const { responses: r } = await getMicrosoftFormResponses(file.id, file.name);
      setResponses(r);
    } catch {
      toast.error(t("ms_forms_load_error"));
    } finally {
      setLoadingResponses(false);
    }
  }, [files, t]);

  const onPickFile = (id: string) => {
    setFileId(id);
    loadResponses(id);
  };

  const importResponse = (fr: MsFormResponse) => {
    if (!canCreatePR) { toast.error(t("no_permission")); return; }
    const entity = (defaultFirmForView(selectedEntity) ?? "IMP") as EntityCode;
    const pr = toPurchaseRequest(fr, entity, currentUser.name);
    addPurchaseRequest(pr);
    logAction(t("einkauf_to_pr"), `${pr.id} · Microsoft Forms`);
    setImported((ids) => [...ids, fr.id]);
    toast.success(t("toast_form_converted", { id: pr.id }));
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> {t("ms_forms_checking")}
      </div>
    );
  }

  if (status === "disconnected") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-center" data-testid="ms-forms-disconnected">
        <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
          <Plug className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="text-sm font-medium">{t("ms_forms_not_connected")}</div>
        <p className="text-xs text-muted-foreground max-w-sm">{t("ms_forms_connect_hint")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="ms-forms-connected">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1">
          <Plug className="h-3 w-3" /> {t("ms_forms_connected")}
        </Badge>
        <div className="flex-1 min-w-[220px]">
          <Select value={fileId} onValueChange={onPickFile} disabled={loadingFiles || files.length === 0}>
            <SelectTrigger data-testid="select-ms-form-file">
              <SelectValue placeholder={loadingFiles ? t("ms_forms_loading_files") : t("ms_forms_pick_file")} />
            </SelectTrigger>
            <SelectContent>
              {files.map((f) => (
                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={loadFiles} disabled={loadingFiles} data-testid="button-ms-forms-refresh">
          <RefreshCw className={`h-4 w-4 mr-1.5 ${loadingFiles ? "animate-spin" : ""}`} /> {t("set_sync_now")}
        </Button>
      </div>

      {files.length === 0 && !loadingFiles && (
        <p className="text-center text-sm text-muted-foreground py-8">{t("ms_forms_no_files")}</p>
      )}

      {loadingResponses && (
        <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> {t("ms_forms_loading_responses")}
        </div>
      )}

      {!loadingResponses && fileId && responses.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">{t("ms_forms_no_responses")}</p>
      )}

      {!loadingResponses && responses.map((fr) => {
        const done = imported.includes(fr.id);
        return (
          <div key={fr.id} className="border border-border rounded-xl p-4" data-testid={`ms-form-${fr.id}`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-medium flex items-center gap-2"><FileInput className="h-4 w-4 text-primary" /> {fr.form}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{fr.respondent}{fr.submittedAt ? ` · ${fr.submittedAt}` : ""}</div>
              </div>
              {done
                ? <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">{t("einkauf_converted")}</Badge>
                : canCreatePR ? <Button size="sm" onClick={() => importResponse(fr)} data-testid={`button-import-ms-${fr.id}`}>{t("einkauf_to_pr")}</Button> : null}
            </div>
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
              {fr.fields.map((f, i) => (
                <div key={i} className="flex justify-between border-b border-dashed border-border/60 py-1">
                  <span className="text-muted-foreground">{f.label}</span>
                  <span className="font-medium text-right">{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
