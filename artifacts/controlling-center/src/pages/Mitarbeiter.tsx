import { useState } from "react";
import { useAppStore } from "@/hooks/use-app-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page";
import { AiInsight } from "@/components/shared/AiInsight";
import { UploadPanel } from "@/components/shared/UploadPanel";
import { scopeByEntity } from "@/data";
import { can, canScoped, userGroupEntities } from "@/data/governance";
import type { DeviceAssignment, Employee, EntityCode, EmployeeStatus } from "@/data/types";
import { Users, CheckCircle2, Laptop, FileSignature, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const EMP_STATUS: Record<string, string> = {
  Aktiv: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  Beurlaubt: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Ausgeschieden: "bg-slate-500/10 text-slate-600 border-slate-500/20",
};
const EMP_STATES: EmployeeStatus[] = ["Aktiv", "Beurlaubt", "Ausgeschieden"];

type EmpForm = Omit<Employee, "id" | "assignedDevices" | "openReturns" | "avatar">;
const emptyEmp = (entity: EntityCode): EmpForm => ({
  name: "", email: "", entity, department: "", position: "", startDate: new Date().toISOString().slice(0, 10), status: "Aktiv", location: "",
});

export default function Mitarbeiter() {
  const { t } = useTranslation();
  const { selectedEntity, deviceAssignments, addDeviceAssignment, employees: allEmployees, inventory, currentUser, entities, addEmployee, updateEmployee, removeEmployee, logAction } = useAppStore();
  const employees = scopeByEntity(allEmployees, selectedEntity);
  const empNames = employees.map((e) => e.name);
  const assignments = deviceAssignments.filter((a) => selectedEntity === "MiGu Group Gesamt" || empNames.includes(a.employee));
  const devices = scopeByEntity(inventory, selectedEntity).filter((i) => i.status === "verfügbar");

  // Companies the current user may add employees to: Controller → all; Geschäftsführer → their group.
  const manageableCodes: EntityCode[] = currentUser.role === "Controller" ? entities.map((e) => e.code) : userGroupEntities(currentUser);
  const canCreate = can(currentUser.role, "mitarbeiter:create") && manageableCodes.length > 0;
  const canEdit = can(currentUser.role, "mitarbeiter:edit");
  const canDeleteAny = can(currentUser.role, "mitarbeiter:delete") && manageableCodes.length > 0;
  const canDeleteRow = (e: Employee) => canScoped(currentUser, "mitarbeiter:delete", e.entity);
  const canAssign = can(currentUser.role, "assignment:create");

  const [open, setOpen] = useState(false);
  const [emp, setEmp] = useState(employees[0]?.name ?? "");
  const [device, setDevice] = useState(devices[0]?.inventoryNumber ?? "");
  const [condition, setCondition] = useState("Neuwertig");

  const [empOpen, setEmpOpen] = useState(false);
  const [empEditId, setEmpEditId] = useState<string | null>(null);
  const [empDeleteId, setEmpDeleteId] = useState<string | null>(null);
  const [empForm, setEmpForm] = useState<EmpForm>(emptyEmp("IMP"));

  const defaultCreateEntity = (): EntityCode => {
    if (selectedEntity !== "MiGu Group Gesamt" && manageableCodes.includes(selectedEntity as EntityCode)) return selectedEntity as EntityCode;
    return manageableCodes[0] ?? "IMP";
  };
  const openEmpCreate = () => { setEmpEditId(null); setEmpForm(emptyEmp(defaultCreateEntity())); setEmpOpen(true); };
  const openEmpEdit = (e: Employee) => { setEmpEditId(e.id); setEmpForm({ name: e.name, email: e.email, entity: e.entity, department: e.department, position: e.position, startDate: e.startDate, status: e.status, location: e.location }); setEmpOpen(true); };
  const saveEmp = () => {
    if (empEditId) {
      if (!canEdit) { toast.error(t("no_permission")); return; }
    } else if (!canScoped(currentUser, "mitarbeiter:create", empForm.entity)) {
      toast.error(t("no_permission")); return;
    }
    if (!empForm.name.trim()) { toast.error(t("name")); return; }
    if (empEditId) {
      updateEmployee(empEditId, empForm);
      logAction(t("emp_edit"), `${empForm.name} (${empForm.entity})`);
      toast.success(t("emp_edit"));
    } else {
      const initials = empForm.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
      addEmployee({ ...empForm, id: `EMP-${Math.floor(Math.random() * 9000 + 1000)}`, avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(initials)}`, assignedDevices: [], openReturns: 0 });
      logAction(t("emp_create"), `${empForm.name} (${empForm.entity})`);
      toast.success(t("emp_create"));
    }
    setEmpOpen(false);
  };
  const confirmEmpDelete = () => {
    if (!empDeleteId) return;
    const e = allEmployees.find((x) => x.id === empDeleteId);
    if (!e || !canScoped(currentUser, "mitarbeiter:delete", e.entity)) { toast.error(t("no_permission")); return; }
    removeEmployee(empDeleteId);
    logAction(t("common_delete"), e.name);
    toast.success(t("common_delete"));
    setEmpDeleteId(null);
  };

  const assign = () => {
    if (!canAssign) { toast.error(t("no_permission")); return; }
    const dev = inventory.find((i) => i.inventoryNumber === device);
    if (!emp || !dev) { toast.error("Bitte Mitarbeiter und Gerät wählen."); return; }
    const da: DeviceAssignment = {
      id: `DA-${Math.floor(Math.random() * 9000 + 1000)}`,
      employee: emp,
      device: dev.name,
      inventoryNumber: dev.inventoryNumber,
      issueDate: new Date().toISOString().slice(0, 10),
      conditionIssue: condition,
      confirmed: false,
    };
    addDeviceAssignment(da);
    toast.success(`${dev.name} an ${emp} ausgegeben.`);
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("mitarbeiter_geraete")}
        subtitle={t("mit_subtitle")}
        icon={<Users className="h-5 w-5" />}
        actions={
          <div className="flex gap-2">
            {canCreate && <Button variant="outline" onClick={openEmpCreate} data-testid="button-add-employee"><Plus className="h-4 w-4 mr-1.5" /> {t("emp_create")}</Button>}
            {canAssign && <Button onClick={() => setOpen(true)} data-testid="button-assign-device"><Laptop className="h-4 w-4 mr-1.5" /> {t("mit_assign_device")}</Button>}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="glass-card"><CardContent className="pt-6"><div className="text-2xl font-bold text-primary">{employees.length}</div><div className="text-sm text-muted-foreground mt-1">{t("mit_employees")}</div></CardContent></Card>
        <Card className="glass-card"><CardContent className="pt-6"><div className="text-2xl font-bold text-primary">{employees.filter((e) => e.status === "Aktiv").length}</div><div className="text-sm text-muted-foreground mt-1">{t("mit_active")}</div></CardContent></Card>
        <Card className="glass-card"><CardContent className="pt-6"><div className="text-2xl font-bold text-primary">{assignments.length}</div><div className="text-sm text-muted-foreground mt-1">{t("mit_assignments")}</div></CardContent></Card>
        <Card className="glass-card"><CardContent className="pt-6"><div className="text-2xl font-bold text-amber-500">{assignments.filter((a) => !a.confirmed).length}</div><div className="text-sm text-muted-foreground mt-1">{t("mit_open_confirmations")}</div></CardContent></Card>
      </div>

      <AiInsight context="mitarbeiter" />

      <Tabs defaultValue="employees">
        <TabsList>
          <TabsTrigger value="employees" data-testid="tab-employees">{t("mit_employees")}</TabsTrigger>
          <TabsTrigger value="assignments" data-testid="tab-assignments">{t("mit_assignments")}</TabsTrigger>
          <TabsTrigger value="belege" data-testid="tab-belege">{t("tab_uploads")}</TabsTrigger>
        </TabsList>

        <TabsContent value="employees">
          <Card className="glass-card">
            <CardHeader><CardTitle>{t("mit_employees")}</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>{t("name")}</TableHead><TableHead>{t("mit_position")}</TableHead><TableHead>{t("mit_department")}</TableHead><TableHead>{t("entity")}</TableHead><TableHead>{t("mit_location")}</TableHead><TableHead>{t("mit_devices")}</TableHead><TableHead>{t("status")}</TableHead>{(canEdit || canDeleteAny) && <TableHead className="text-right">{t("common_action")}</TableHead>}</TableRow></TableHeader>
                <TableBody>
                  {employees.map((e) => (
                    <TableRow key={e.id} data-testid={`row-employee-${e.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8"><AvatarImage src={e.avatar} /><AvatarFallback>{e.name.split(" ").map((n) => n[0]).join("")}</AvatarFallback></Avatar>
                          <div><div className="font-medium">{e.name}</div><div className="text-xs text-muted-foreground">{e.email}</div></div>
                        </div>
                      </TableCell>
                      <TableCell>{e.position}</TableCell>
                      <TableCell>{e.department}</TableCell>
                      <TableCell>{e.entity}</TableCell>
                      <TableCell className="text-muted-foreground">{e.location}</TableCell>
                      <TableCell>{e.assignedDevices.length}</TableCell>
                      <TableCell><Badge variant="outline" className={EMP_STATUS[e.status]}>{e.status}</Badge></TableCell>
                      {(canEdit || canDeleteAny) && (
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            {canEdit && <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEmpEdit(e)} data-testid={`button-edit-employee-${e.id}`}><Pencil className="h-3.5 w-3.5" /></Button>}
                            {canDeleteRow(e) && <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setEmpDeleteId(e.id)} data-testid={`button-delete-employee-${e.id}`}><Trash2 className="h-3.5 w-3.5" /></Button>}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {employees.length === 0 && <TableRow><TableCell colSpan={canEdit || canDeleteAny ? 8 : 7} className="text-center text-muted-foreground py-8">—</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments">
          <Card className="glass-card">
            <CardHeader><CardTitle>{t("mit_assignment_logs")}</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>{t("mit_employee")}</TableHead><TableHead>{t("common_device")}</TableHead><TableHead>{t("common_inv_no")}</TableHead><TableHead>{t("mit_issue")}</TableHead><TableHead>{t("mit_return")}</TableHead><TableHead>{t("condition")}</TableHead><TableHead>{t("mit_confirmed")}</TableHead></TableRow></TableHeader>
                <TableBody>
                  {assignments.map((a) => (
                    <TableRow key={a.id} data-testid={`row-assignment-${a.id}`}>
                      <TableCell className="font-medium">{a.employee}</TableCell>
                      <TableCell>{a.device}</TableCell>
                      <TableCell className="font-mono text-xs">{a.inventoryNumber}</TableCell>
                      <TableCell className="text-muted-foreground">{a.issueDate}</TableCell>
                      <TableCell className="text-muted-foreground">{a.returnDate ?? "—"}</TableCell>
                      <TableCell>{a.conditionReturn ?? a.conditionIssue}</TableCell>
                      <TableCell>{a.confirmed ? <span className="inline-flex items-center gap-1 text-emerald-600 text-sm"><CheckCircle2 className="h-4 w-4" /> {t("common_yes")}</span> : <span className="inline-flex items-center gap-1 text-amber-600 text-sm"><FileSignature className="h-4 w-4" /> {t("open")}</span>}</TableCell>
                    </TableRow>
                  ))}
                  {assignments.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">{t("mit_empty_assignments")}</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="belege">
          <UploadPanel docTypes={["Mitarbeiterliste"]} defaultDocType="Mitarbeiterliste" />
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("mit_assign_device")}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>{t("mit_employee")}</Label>
              <Select value={emp} onValueChange={setEmp}><SelectTrigger data-testid="select-employee"><SelectValue placeholder={t("common_select")} /></SelectTrigger>
                <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>{t("mit_available_device")}</Label>
              <Select value={device} onValueChange={setDevice}><SelectTrigger data-testid="select-device"><SelectValue placeholder={t("common_select")} /></SelectTrigger>
                <SelectContent>{devices.length ? devices.map((d) => <SelectItem key={d.id} value={d.inventoryNumber}>{d.name} ({d.inventoryNumber})</SelectItem>) : <div className="px-2 py-1.5 text-sm text-muted-foreground">{t("mit_no_devices")}</div>}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>{t("mit_condition_issue")}</Label><Input value={condition} onChange={(e) => setCondition(e.target.value)} data-testid="input-condition" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t("cancel")}</Button>
            <Button onClick={assign} data-testid="button-submit-assign">{t("mit_issue_btn")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={empOpen} onOpenChange={setEmpOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{empEditId ? t("emp_edit") : t("emp_create")}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>{t("name")}</Label><Input value={empForm.name} onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })} data-testid="input-employee-name" /></div>
              <div className="space-y-1.5"><Label>{t("mit_email")}</Label><Input value={empForm.email} onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })} data-testid="input-employee-email" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>{t("mit_position")}</Label><Input value={empForm.position} onChange={(e) => setEmpForm({ ...empForm, position: e.target.value })} data-testid="input-employee-position" /></div>
              <div className="space-y-1.5"><Label>{t("mit_department")}</Label><Input value={empForm.department} onChange={(e) => setEmpForm({ ...empForm, department: e.target.value })} data-testid="input-employee-department" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>{t("entity")}</Label>
                <Select value={empForm.entity} onValueChange={(v) => setEmpForm({ ...empForm, entity: v as EntityCode })}>
                  <SelectTrigger data-testid="select-employee-entity"><SelectValue /></SelectTrigger>
                  <SelectContent>{manageableCodes.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>{t("mit_location")}</Label><Input value={empForm.location} onChange={(e) => setEmpForm({ ...empForm, location: e.target.value })} data-testid="input-employee-location" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>{t("strat_start")}</Label><Input type="date" value={empForm.startDate} onChange={(e) => setEmpForm({ ...empForm, startDate: e.target.value })} data-testid="input-employee-start" /></div>
              <div className="space-y-1.5"><Label>{t("status")}</Label>
                <Select value={empForm.status} onValueChange={(v) => setEmpForm({ ...empForm, status: v as EmployeeStatus })}>
                  <SelectTrigger data-testid="select-employee-status"><SelectValue /></SelectTrigger>
                  <SelectContent>{EMP_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmpOpen(false)}>{t("cancel")}</Button>
            <Button onClick={saveEmp} data-testid="button-save-employee">{t("common_save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!empDeleteId} onOpenChange={(o) => !o && setEmpDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{t("common_delete_confirm_title")}</AlertDialogTitle><AlertDialogDescription>{t("common_delete_confirm_desc")}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmEmpDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" data-testid="button-confirm-delete-employee">{t("common_delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
