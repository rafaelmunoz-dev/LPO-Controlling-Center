import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useAppStore, USERS } from "@/hooks/use-app-context";
import { ROLE_DEFS, ROLE_PERMISSIONS, type NavKey } from "@/data/governance";
import type { AppUser } from "@/data/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogIn, ArrowRight } from "lucide-react";
import lpoLogo from "@assets/image_1780570561463.png";

const NAV_META: Record<NavKey, { href: string; labelKey: string }> = {
  dashboard: { href: "/", labelKey: "dashboard" },
  finanzen: { href: "/finanzen", labelKey: "finanzen" },
  belege: { href: "/belege", labelKey: "belege" },
  umsatz: { href: "/umsatz", labelKey: "umsatz" },
  entitaeten: { href: "/entitaeten", labelKey: "entitaeten" },
  gewinnverlust: { href: "/gewinn-verlust", labelKey: "gewinnverlust" },
  einkauf: { href: "/einkauf", labelKey: "einkauf" },
  inventar: { href: "/inventar", labelKey: "inventar" },
  mitarbeiter: { href: "/mitarbeiter", labelKey: "mitarbeiter_geraete" },
  freigaben: { href: "/freigaben", labelKey: "freigaben" },
  prognosen: { href: "/prognosen", labelKey: "prognosen" },
  risiko: { href: "/risiko", labelKey: "risiko_premortem" },
  strategie: { href: "/strategie", labelKey: "strategie" },
  audit: { href: "/audit", labelKey: "audit_nav" },
  reports: { href: "/reports", labelKey: "reports" },
  einstellungen: { href: "/einstellungen", labelKey: "einstellungen" },
};

export default function Login() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const login = useAppStore((s) => s.login);

  const homeFor = (user: AppUser) => {
    const first = ROLE_PERMISSIONS[user.role][0];
    return first ? NAV_META[first].href : "/";
  };

  const signIn = (user: AppUser, href?: string) => {
    login(user);
    navigate(href ?? homeFor(user));
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-cyan-50/40 flex flex-col items-center px-4 py-10 overflow-y-auto">
      <div className="w-full max-w-6xl">
        <div className="flex flex-col items-center text-center mb-8">
          <img src={lpoLogo} alt="LPO International" className="h-10 w-auto mb-4" data-testid="img-login-logo" />
          <h1 className="text-2xl font-bold text-primary">{t("login_title")}</h1>
          <p className="text-muted-foreground mt-1.5 max-w-xl">{t("login_subtitle")}</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {USERS.map((user) => {
            const def = ROLE_DEFS.find((d) => d.role === user.role);
            const nav = ROLE_PERMISSIONS[user.role].filter((k) => k !== "einstellungen");
            const direct = nav.slice(0, 5);
            const extra = nav.length - direct.length;
            return (
              <Card key={user.id} className="glass-card flex flex-col" data-testid={`card-login-${user.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11 border border-border">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{user.name.split(" ").map((n) => n[0]).join("")}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="font-semibold leading-tight truncate">{user.name}</div>
                      <div className="text-sm text-brass font-medium">{user.role}</div>
                      <div className="text-xs text-muted-foreground truncate">{user.organisation}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 gap-3">
                  <p className="text-sm text-muted-foreground min-h-[2.5rem]">{def ? t(def.descriptionKey) : ""}</p>
                  <div>
                    <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1.5">{t("login_access_to")}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {direct.map((k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => signIn(user, NAV_META[k].href)}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-muted/50 px-2.5 py-1 text-xs font-medium text-foreground/80 hover:border-brass/40 hover:text-brass transition-colors"
                          data-testid={`link-direct-${user.id}-${k}`}
                        >
                          {t(NAV_META[k].labelKey)}
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      ))}
                      {extra > 0 && (
                        <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                          {t("login_more", { count: extra })}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button className="w-full mt-auto" onClick={() => signIn(user)} data-testid={`button-login-${user.id}`}>
                    <LogIn className="h-4 w-4 mr-1.5" /> {t("login_signin")}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">{t("login_demo_note")}</p>
      </div>
    </div>
  );
}
