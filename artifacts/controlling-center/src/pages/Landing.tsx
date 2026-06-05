import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Building2, ShieldCheck, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { basePath } from "@/auth/clerk";

export default function Landing() {
  const { t } = useTranslation();

  const features = [
    { icon: Building2, title: t("landing_f1_title"), desc: t("landing_f1_desc") },
    { icon: ShieldCheck, title: t("landing_f2_title"), desc: t("landing_f2_desc") },
    { icon: Users, title: t("landing_f3_title"), desc: t("landing_f3_desc") },
  ];

  return (
    <div className="min-h-[100dvh] bg-slate-50 text-slate-900">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <img src={`${basePath}/logo.svg`} alt="LPO Controlling Center" className="h-9 w-auto" />
        <div className="flex items-center gap-2">
          <Link href="/sign-in">
            <Button variant="ghost" data-testid="button-nav-signin">{t("landing_cta_signin")}</Button>
          </Link>
          <Link href="/sign-up">
            <Button data-testid="button-nav-signup">{t("landing_cta_start")}</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        <section className="py-16 sm:py-24">
          <span className="inline-flex items-center rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700 ring-1 ring-teal-100">
            {t("landing_badge")}
          </span>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            {t("landing_title")}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-500">{t("landing_subtitle")}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/sign-up">
              <Button size="lg" data-testid="button-hero-start">
                {t("landing_cta_start")} <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button size="lg" variant="outline" data-testid="button-hero-signin">{t("landing_cta_signin")}</Button>
            </Link>
          </div>
        </section>

        <section className="grid gap-5 pb-24 sm:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-slate-500">{f.desc}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
