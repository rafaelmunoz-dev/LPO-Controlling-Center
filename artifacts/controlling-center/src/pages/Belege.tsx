import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppStore } from "@/hooks/use-app-context";
import { useFormat } from "@/hooks/use-format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Term } from "@/components/shared/Term";
import { UPLOAD_ROLES, UPLOAD_PROCESS_ROLES } from "@/data/governance";
import {
  parseBankCsv,
  suggestForTransaction,
  EXPENSE_BUDGET_CATEGORIES,
  defaultFirmForView,
} from "@/data";
import { aiSuggestExpense } from "@/lib/ai";
import type { BankTransaction, EntityCode, SuggestionSource } from "@/data/types";
import { UploadCloud, Sparkles, CheckCircle2, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

function SourceBadge({ source }: { source?: SuggestionSource | null }) {
  const { t } = useTranslation();
  if (!source) {
    return <Badge variant="outline" className="text-xs">{t("beleg_source_manual")}</Badge>;
  }
  const style: Record<SuggestionSource, string> = {
    learned: "bg-emerald-100 text-emerald-700 border-emerald-200",
    ai: "bg-violet-100 text-violet-700 border-violet-200",
    heuristic: "bg-amber-100 text-amber-700 border-amber-200",
  };
  const label: Record<SuggestionSource, string> = {
    learned: t("beleg_source_learned"),
    ai: t("beleg_source_ai"),
    heuristic: t("beleg_source_heuristic"),
  };
  return <Badge variant="outline" className={`text-xs ${style[source]}`}>{label[source]}</Badge>;
}

export function BelegeView() {
  const { t } = useTranslation();
  const { currency, date } = useFormat();
  const {
    bankTransactions,
    vendorMappings,
    entities,
    selectedEntity,
    currentUser,
    importBankTransactions,
    assignTransaction,
    bookTransaction,
    removeBankTransaction,
    logAction,
  } = useAppStore();

  const canUpload = UPLOAD_ROLES.includes(currentUser.role);
  const canProcess = UPLOAD_PROCESS_ROLES.includes(currentUser.role);
  const fileRef = useRef<HTMLInputElement>(null);
  const [aiBusy, setAiBusy] = useState(false);

  const entityCodes = entities.filter((e) => !e.archived).map((e) => e.code);
  const defaultEntity: EntityCode | undefined = defaultFirmForView(selectedEntity) ?? entityCodes[0];

  const needsAssignment = bankTransactions.filter((t) => t.status === "needs-assignment");
  const booked = bankTransactions.filter((t) => t.status === "booked");

  const handleFile = async (file: File) => {
    if (!canUpload) {
      toast.error(t("no_permission"));
      return;
    }
    const text = await file.text();
    const result = parseBankCsv(text);
    if (result.errors.length > 0) {
      toast.error(`${t("beleg_parse_errors")}: ${result.errors.slice(0, 3).join(" · ")}`);
    }
    if (result.transactions.length === 0) return;

    const now = new Date().toISOString();
    const txs: BankTransaction[] = result.transactions.map((p, i) => {
      const s = suggestForTransaction(p, vendorMappings, defaultEntity);
      return {
        id: `BTX-${Date.now()}-${i}`,
        date: p.date,
        payee: p.payee,
        description: p.description,
        amount: p.amount,
        entity: s.entity,
        category: s.category,
        status: "needs-assignment",
        suggestionSource: s.source,
        suggestionReason: s.reason,
        importedAt: now,
      };
    });
    importBankTransactions(txs);
    logAction(t("beleg_import"), `${txs.length} ${t("beleg_transactions")}`);
    toast.success(`${txs.length} ${t("beleg_imported")}${result.skippedIncome ? ` · ${result.skippedIncome} ${t("beleg_income_skipped")}` : ""}`);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    e.target.value = "";
  };

  const runAiSuggestions = async () => {
    if (!canProcess) {
      toast.error(t("no_permission"));
      return;
    }
    const targets = bankTransactions.filter(
      (t) => t.status === "needs-assignment" && t.suggestionSource !== "learned",
    );
    if (targets.length === 0) {
      toast.info(t("beleg_no_ai_targets"));
      return;
    }
    setAiBusy(true);
    let applied = 0;
    for (const tx of targets) {
      const res = await aiSuggestExpense({
        payee: tx.payee,
        description: tx.description,
        amount: tx.amount,
        entities: entityCodes,
        categories: [...EXPENSE_BUDGET_CATEGORIES],
      });
      if (res) {
        assignTransaction(tx.id, {
          entity: res.entity,
          category: res.category,
          suggestionSource: "ai",
          suggestionReason: res.reason,
        });
        applied++;
      }
    }
    setAiBusy(false);
    if (applied > 0) toast.success(`${applied} ${t("beleg_ai_applied")}`);
    else toast.info(t("beleg_ai_none"));
  };

  const book = (tx: BankTransaction) => {
    if (!canProcess) {
      toast.error(t("no_permission"));
      return;
    }
    if (!tx.entity || !tx.category) {
      toast.error(t("beleg_assign_first"));
      return;
    }
    bookTransaction(tx.id);
    logAction(t("beleg_book"), `${tx.payee || tx.description} · ${currency(tx.amount)} · ${tx.entity}`);
    toast.success(t("beleg_booked"));
  };

  const remove = (tx: BankTransaction) => {
    if (!canProcess) {
      toast.error(t("no_permission"));
      return;
    }
    removeBankTransaction(tx.id);
    toast.success(t("beleg_removed"));
  };

  return (
    <div className="space-y-4">
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <UploadCloud className="h-4 w-4" /> {t("beleg_upload_title")}
          </CardTitle>
          <div className="flex items-center gap-2">
            {canProcess && needsAssignment.length > 0 && (
              <Button size="sm" variant="outline" onClick={runAiSuggestions} disabled={aiBusy} data-testid="button-ai-suggest">
                {aiBusy ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1.5" />}
                {t("beleg_ai_suggest")}
              </Button>
            )}
            {canUpload && (
              <Button size="sm" onClick={() => fileRef.current?.click()} data-testid="button-upload-csv">
                <UploadCloud className="h-4 w-4 mr-1.5" /> {t("beleg_upload_csv")}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onFileChange} data-testid="input-csv-file" />
          <p className="text-sm text-muted-foreground">{t("beleg_upload_hint")}</p>
        </CardContent>
      </Card>

      <Tabs defaultValue="open">
        <TabsList>
          <TabsTrigger value="open" data-testid="tab-open">{t("beleg_tab_open")} ({needsAssignment.length})</TabsTrigger>
          <TabsTrigger value="booked" data-testid="tab-booked">{t("beleg_tab_booked")} ({booked.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="open">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle><Term k="budget_ist">{t("beleg_open_title")}</Term></CardTitle>
            </CardHeader>
            <CardContent>
              {needsAssignment.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">{t("beleg_empty_open")}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("beleg_date")}</TableHead>
                      <TableHead>{t("beleg_payee")}</TableHead>
                      <TableHead className="text-right">{t("beleg_amount")}</TableHead>
                      <TableHead>{t("entity")}</TableHead>
                      <TableHead>{t("beleg_category")}</TableHead>
                      <TableHead>{t("beleg_suggestion")}</TableHead>
                      <TableHead className="text-right">{t("beleg_actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {needsAssignment.map((tx) => (
                      <TableRow key={tx.id} data-testid={`row-tx-${tx.id}`}>
                        <TableCell className="whitespace-nowrap text-sm">{date(tx.date)}</TableCell>
                        <TableCell className="max-w-[220px]">
                          <p className="truncate text-sm font-medium">{tx.payee || "—"}</p>
                          {tx.description && <p className="truncate text-xs text-muted-foreground">{tx.description}</p>}
                        </TableCell>
                        <TableCell className="text-right tabular-nums whitespace-nowrap">{currency(tx.amount)}</TableCell>
                        <TableCell>
                          <Select
                            value={tx.entity ?? ""}
                            onValueChange={(v) => assignTransaction(tx.id, { entity: v as EntityCode, suggestionSource: null, suggestionReason: undefined })}
                          >
                            <SelectTrigger className="h-8 w-[100px]" data-testid={`select-entity-${tx.id}`}><SelectValue placeholder="—" /></SelectTrigger>
                            <SelectContent>
                              {entityCodes.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={tx.category ?? ""}
                            onValueChange={(v) => assignTransaction(tx.id, { category: v, suggestionSource: null, suggestionReason: undefined })}
                          >
                            <SelectTrigger className="h-8 w-[170px]" data-testid={`select-category-${tx.id}`}><SelectValue placeholder="—" /></SelectTrigger>
                            <SelectContent>
                              {EXPENSE_BUDGET_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <SourceBadge source={tx.suggestionSource} />
                            {tx.suggestionReason && <span className="text-xs text-muted-foreground max-w-[180px] truncate" title={tx.suggestionReason}>{tx.suggestionReason}</span>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {canProcess && (
                              <Button size="sm" className="h-8 gap-1" onClick={() => book(tx)} data-testid={`button-book-${tx.id}`}>
                                <CheckCircle2 className="h-3.5 w-3.5" /> {t("beleg_book")}
                              </Button>
                            )}
                            {canProcess && (
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => remove(tx)} data-testid={`button-remove-${tx.id}`}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="booked">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>{t("beleg_booked_title")}</CardTitle>
            </CardHeader>
            <CardContent>
              {booked.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">{t("beleg_empty_booked")}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("beleg_date")}</TableHead>
                      <TableHead>{t("beleg_payee")}</TableHead>
                      <TableHead className="text-right">{t("beleg_amount")}</TableHead>
                      <TableHead>{t("entity")}</TableHead>
                      <TableHead>{t("beleg_category")}</TableHead>
                      <TableHead>{t("beleg_booked_by")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {booked.map((tx) => (
                      <TableRow key={tx.id} data-testid={`row-booked-${tx.id}`}>
                        <TableCell className="whitespace-nowrap text-sm">{date(tx.date)}</TableCell>
                        <TableCell className="max-w-[220px]">
                          <p className="truncate text-sm font-medium">{tx.payee || "—"}</p>
                          {tx.description && <p className="truncate text-xs text-muted-foreground">{tx.description}</p>}
                        </TableCell>
                        <TableCell className="text-right tabular-nums whitespace-nowrap">{currency(tx.amount)}</TableCell>
                        <TableCell>{tx.entity}</TableCell>
                        <TableCell>{tx.category}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{tx.bookedBy}{tx.bookedAt ? ` · ${date(tx.bookedAt)}` : ""}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
