import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Finanzen from "@/pages/Finanzen";
import UploadCenter from "@/pages/UploadCenter";
import Einkauf from "@/pages/Einkauf";
import Inventar from "@/pages/Inventar";
import Mitarbeiter from "@/pages/Mitarbeiter";
import Freigaben from "@/pages/Freigaben";
import Prognosen from "@/pages/Prognosen";
import Risiko from "@/pages/Risiko";
import Strategie from "@/pages/Strategie";
import Entitaeten from "@/pages/Entitaeten";
import Reports from "@/pages/Reports";
import Microsoft from "@/pages/Microsoft";
import Benutzer from "@/pages/Benutzer";
import Einstellungen from "@/pages/Einstellungen";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/finanzen" component={Finanzen} />
        <Route path="/upload" component={UploadCenter} />
        <Route path="/einkauf" component={Einkauf} />
        <Route path="/inventar" component={Inventar} />
        <Route path="/mitarbeiter" component={Mitarbeiter} />
        <Route path="/freigaben" component={Freigaben} />
        <Route path="/prognosen" component={Prognosen} />
        <Route path="/risiko" component={Risiko} />
        <Route path="/strategie" component={Strategie} />
        <Route path="/entitaeten" component={Entitaeten} />
        <Route path="/reports" component={Reports} />
        <Route path="/microsoft" component={Microsoft} />
        <Route path="/benutzer" component={Benutzer} />
        <Route path="/einstellungen" component={Einstellungen} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
