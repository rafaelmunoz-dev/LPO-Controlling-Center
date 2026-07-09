import { useTranslation } from "react-i18next";
import { useClerk } from "@clerk/react";
import { LogOut, ShieldX } from "lucide-react";
import { basePath } from "@/auth/clerk";

export default function NoAccess() {
  const { t } = useTranslation();
  const { signOut } = useClerk();

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-200 text-center">
        <div className="mb-6 flex items-center justify-center gap-3">
          <img src={`${basePath}/logo.svg`} alt="LPO Controlling Center" className="h-9 w-auto" />
        </div>

        <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
          <ShieldX className="h-6 w-6" />
        </div>

        <h1 className="text-xl font-semibold text-slate-900" data-testid="text-noaccess-title">{t("noacc_title")}</h1>
        <p className="mt-1.5 text-sm text-slate-500" data-testid="text-noaccess-subtitle">{t("noacc_subtitle")}</p>

        <button
          type="button"
          onClick={() => signOut({ redirectUrl: basePath || "/" })}
          className="mt-6 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600"
          data-testid="button-noaccess-signout"
        >
          <LogOut className="h-3.5 w-3.5" /> {t("logout")}
        </button>
      </div>
    </div>
  );
}
