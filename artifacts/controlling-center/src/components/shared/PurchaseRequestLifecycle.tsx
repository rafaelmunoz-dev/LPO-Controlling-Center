import { useEffect, useState } from "react";
import { useAppStore } from "@/hooks/use-app-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EXPENSE_BUDGET_CATEGORIES } from "@/data/finance";
import { APPROVER_ROLES, can, INVENTORY_EDIT_ROLES, UPLOAD_PROCESS_ROLES, UPLOAD_ROLES } from "@/data/governance";
import { formatCurrency } from "@/data";
import type { InventoryItem, PurchaseRequest } from "@/data/types";
import { CheckCircle2, Circle, GitBranch, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { tLabel } from "@/i18n/labels";
import { tContent } from "@/i18n/content";

const INVENTORY_CATEGORIES: InventoryItem["category"][] = [
  "Laptop", "Monitor", "Handy", "Tablet", "Möbel", "Maschine", "Fahrzeug", "Software-Lizenz", "Sonstiges",
];

type StepState = "done" | "current" | "pending" | "rejected" | "optional";

function StepIcon({ state }: { state: StepState }) {
  if (state === "done") return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
  if (state === "rejected") return <XCircle className="h-5 w-5 text-destructive" />;
  if (state === "current") return <Circle className="h-5 w-5 text-primary fill-primary/15" />;
  return <Circle className="h-5 w-5 text-muted-foreground/50" />;
}

function StateLabel({ state }: { state: StepState }) {
  const { t } = useTranslation();
  const map: Record<StepState, { key: string; cls: string }> = {
    done: { key: "lc_done", cls: "text-emerald-600 border-emerald-600/30" },
    current: { key: "lc_pending", cls: "text-primary border-primary/30" },
    pending: { key: "lc_pending", cls: "text-muted-foreground border-border" },
    rejected: { key: "lc_rejected", cls: "text-destructive border-destructive/30" },
    optional: { key: "lc_optional", cls: "text-muted-foreground border-border" },
  };
  const m = map[state];
  return <Badge variant="outline" className={`text-[10px] ${m.cls}`}>{t(m.key)}</Badge>;
}

export function PurchaseRequestLifecycle({ pr }: { pr: PurchaseRequest }) {
  const { t } = useTranslation();
  const { currentUser, bankTransactions, inventory, updatePRStatus, payPurchaseRequest, categorizePurchaseRequest, transferPurchaseRequestToInventory } = useAppStore();
  const [open, setOpen] = useState(false);

  const canApprove = APPROVER_ROLES.includes(currentUser.role);
  const canPay = UPLOAD_ROLES.includes(currentUser.role);
  const canBook = UPLOAD_PROCESS_ROLES.includes(currentUser.role);
  const canInv = INVENTORY_EDIT_ROLES.includes(currentUser.role) || can(currentUser.role, "inventar:create");

  const bankTx = pr.bankTransactionId ? bankTransactions.find((tx) => tx.id === pr.bankTransactionId) : undefined;
  const invItem = pr.inventoryItemId ? inventory.find((i) => i.id === pr.inventoryItemId) : undefined;

  const [cat, setCat] = useState<string>(bankTx?.category ?? EXPENSE_BUDGET_CATEGORIES[0]);
  const [invName, setInvName] = useState(pr.title);
  const [invCat, setInvCat] = useState<InventoryItem["category"]>("Sonstiges");

  useEffect(() => {
    if (bankTx?.category) setCat(bankTx.category);
  }, [bankTx?.category]);

  const rejected = pr.status === "Abgelehnt";
  const approved = ["Freigegeben", "Bestellt", "Erhalten", "Bezahlt"].includes(pr.status);
  const paid = pr.status === "Bezahlt" && !!bankTx;
  const booked = !!bankTx && bankTx.status === "booked" && !!bankTx.category;

  const approvalState: StepState = rejected ? "rejected" : approved ? "done" : "current";
  const paymentState: StepState = rejected ? "pending" : paid ? "done" : approved ? "current" : "pending";
  const categoryState: StepState = booked ? "done" : paid ? "current" : "pending";
  const inventoryState: StepState = invItem ? "done" : "optional";

  const Step = ({ index, title, state, last, children }: { index: number; title: string; state: StepState; last?: boolean; children?: React.ReactNode }) => (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <StepIcon state={state} />
        {!last && <div className={`w-px flex-1 my-1 ${state === "done" ? "bg-emerald-600/40" : "bg-border"}`} />}
      </div>
      <div className="flex-1 pb-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">{index}. {title}</span>
          <StateLabel state={state} />
        </div>
        {children && <div className="mt-1.5 text-xs text-muted-foreground space-y-2">{children}</div>}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="outline" className="h-7 w-7" title={t("einkauf_lifecycle")} data-testid={`button-lifecycle-${pr.id}`}>
          <GitBranch className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("einkauf_lifecycle_title")}</DialogTitle>
        </DialogHeader>
        <div className="text-xs text-muted-foreground -mt-1 mb-1">
          <span className="font-mono">{pr.id}</span> · {tContent(pr.title)} · {pr.supplier} · {formatCurrency(pr.amount)}
        </div>

        <div className="mt-1">
          <Step index={1} title={t("lc_step_request")} state="done">
            <div>{t("lc_created_by")}: {pr.requestedBy} · {pr.createdAt}</div>
          </Step>

          <Step index={2} title={t("lc_step_approval")} state={approvalState}>
            {approvalState === "current" && canApprove && (
              <Button size="sm" className="h-7" onClick={() => { updatePRStatus(pr.id, "Freigegeben"); toast.success(`${pr.id} ${t("lc_action_approve")}`); }} data-testid={`lc-approve-${pr.id}`}>
                {t("lc_action_approve")}
              </Button>
            )}
          </Step>

          <Step index={3} title={t("lc_step_payment")} state={paymentState}>
            {paid && bankTx && (
              <div>{t("lc_on_statement")} · <span className="font-mono">{bankTx.id}</span> · {pr.paidAt && `${t("lc_paid_on")} ${pr.paidAt}`}</div>
            )}
            {paymentState === "current" && canPay && (
              <Button size="sm" className="h-7" onClick={() => { if (payPurchaseRequest(pr.id)) toast.success(t("lc_toast_paid")); }} data-testid={`lc-pay-${pr.id}`}>
                {t("lc_action_pay")}
              </Button>
            )}
          </Step>

          <Step index={4} title={t("lc_step_category")} state={categoryState}>
            {booked && bankTx && <div>{t("lc_booked_as")}: <Badge variant="outline" className="text-[10px]">{tLabel(t, bankTx.category)}</Badge></div>}
            {categoryState === "current" && canBook && (
              <div className="flex items-center gap-2">
                <Select value={cat} onValueChange={setCat}>
                  <SelectTrigger className="h-7 w-44" data-testid={`lc-cat-select-${pr.id}`}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EXPENSE_BUDGET_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{tLabel(t, c)}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button size="sm" className="h-7" onClick={() => { if (categorizePurchaseRequest(pr.id, cat)) toast.success(t("lc_toast_booked")); }} data-testid={`lc-book-${pr.id}`}>
                  {t("lc_action_book")}
                </Button>
              </div>
            )}
          </Step>

          <Step index={5} title={t("lc_step_inventory")} state={inventoryState} last>
            {invItem && <div>{t("lc_inv_number")}: <span className="font-mono">{invItem.inventoryNumber}</span> · {tLabel(t, invItem.category)}</div>}
            {!invItem && paid && canInv && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px]">{t("name")}</Label>
                    <Input value={invName} onChange={(e) => setInvName(e.target.value)} className="h-7" data-testid={`lc-inv-name-${pr.id}`} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">{t("category")}</Label>
                    <Select value={invCat} onValueChange={(v) => setInvCat(v as InventoryItem["category"])}>
                      <SelectTrigger className="h-7" data-testid={`lc-inv-cat-${pr.id}`}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {INVENTORY_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{tLabel(t, c)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button size="sm" className="h-7" onClick={() => { if (transferPurchaseRequestToInventory(pr.id, { name: invName, category: invCat })) toast.success(t("lc_toast_inventory")); }} data-testid={`lc-inventory-${pr.id}`}>
                  {t("lc_action_to_inventory")}
                </Button>
              </div>
            )}
          </Step>
        </div>
      </DialogContent>
    </Dialog>
  );
}
