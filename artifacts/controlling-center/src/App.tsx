import { useEffect } from "react";
import { Switch, Route, Link, Router as WouterRouter } from "wouter";
import type { ComponentType } from "react";
import { useTranslation } from "react-i18next";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import { useAppStore } from "@/hooks/use-app-context";
import type { NavKey } from "@/data/governance";
import { AppLayout } from "@/components/layout/AppLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Finanzen from "@/pages/Finanzen";
import Umsatz from "@/pages/Umsatz";
import Einkauf from "@/pages/Einkauf";
import Inventar from "@/pages/Inventar";
import Mitarbeiter from "@/pages/Mitarbeiter";
import Freigaben from "@/pages/Freigaben";
import Prognosen from "@/pages/Prognosen";
import Risiko from "@/pages/Risiko";
import Strategie from "@/pages/Strategie";
import Entitaeten from "@/pages/Entitaeten";
import GewinnVerlust from "@/pages/GewinnVerlust";
import AuditLog from "@/pages/AuditLog";
import Reports from "@/pages/Reports";
import Einstellungen from "@/pages/Einstellungen";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function AccessDenied() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center" data-testid="access-denied">
      <ShieldAlert className="h-12 w-12 text-muted-foreground mb-4" />
      <h2 className="text-xl font-semibold">{t("access_denied")}</h2>
      <p className="text-muted-foreground mt-1 mb-5 max-w-sm">{t("access_denied_desc")}</p>
      <Link href="/"><Button>{t("back_to_dashboard")}</Button></Link>
    </div>
  );
}

function Guarded({ navKey, component: Component }: { navKey: NavKey; component: ComponentType }) {
  const { allowedNav } = useAppStore();
  if (!allowedNav().includes(navKey)) return <AccessDenied />;
  return <Component />;
}

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/">{() => <Guarded navKey="dashboard" component={Dashboard} />}</Route>
        <Route path="/finanzen">{() => <Guarded navKey="finanzen" component={Finanzen} />}</Route>
        <Route path="/umsatz">{() => <Guarded navKey="umsatz" component={Umsatz} />}</Route>
        <Route path="/einkauf">{() => <Guarded navKey="einkauf" component={Einkauf} />}</Route>
        <Route path="/inventar">{() => <Guarded navKey="inventar" component={Inventar} />}</Route>
        <Route path="/mitarbeiter">{() => <Guarded navKey="mitarbeiter" component={Mitarbeiter} />}</Route>
        <Route path="/freigaben">{() => <Guarded navKey="freigaben" component={Freigaben} />}</Route>
        <Route path="/prognosen">{() => <Guarded navKey="prognosen" component={Prognosen} />}</Route>
        <Route path="/risiko">{() => <Guarded navKey="risiko" component={Risiko} />}</Route>
        <Route path="/strategie">{() => <Guarded navKey="strategie" component={Strategie} />}</Route>
        <Route path="/entitaeten">{() => <Guarded navKey="entitaeten" component={Entitaeten} />}</Route>
        <Route path="/gewinn-verlust">{() => <Guarded navKey="gewinnverlust" component={GewinnVerlust} />}</Route>
        <Route path="/audit">{() => <Guarded navKey="audit" component={AuditLog} />}</Route>
        <Route path="/reports">{() => <Guarded navKey="reports" component={Reports} />}</Route>
        <Route path="/einstellungen">{() => <Guarded navKey="einstellungen" component={Einstellungen} />}</Route>
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function Root() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const language = useAppStore((s) => s.language);
  const { i18n } = useTranslation();

  useEffect(() => {
    if (i18n.language !== language) i18n.changeLanguage(language);
  }, [language, i18n]);

  if (!isAuthenticated) return <Login />;
  return <Router />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Root />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
