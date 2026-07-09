import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Redirect } from "wouter";
import { useSignIn } from "@clerk/react/legacy";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// REQUIRED — copy verbatim. Resolves the key from window.location.hostname so the
// same build serves multiple Clerk custom domains.
export const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

// REQUIRED — copy verbatim. Empty in dev, auto-set in prod. Never gate on PROD.
export const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

export const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

// Clerk passes full paths to routerPush/routerReplace, but wouter's setLocation
// prepends the base — strip it to avoid doubling.
export function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

// Capture a shareable invite token (?invite=...) before Clerk's sign-up/sign-in
// navigation strips it from the URL, so it can be redeemed after authentication.
export const INVITE_TOKEN_KEY = "lpo-invite-token";
const inviteParam = new URLSearchParams(window.location.search).get("invite");
if (inviteParam) sessionStorage.setItem(INVITE_TOKEN_KEY, inviteParam);

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in environment");
}

export const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#0a1a33",
    colorForeground: "#0a1a33",
    colorMutedForeground: "#5b6b85",
    colorDanger: "#dc2626",
    colorBackground: "#ffffff",
    colorInput: "#ffffff",
    colorInputForeground: "#0a1a33",
    colorNeutral: "#dbe2ea",
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    borderRadius: "1rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl ring-1 ring-slate-200",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-slate-900 font-semibold",
    headerSubtitle: "text-slate-500",
    socialButtonsBlockButtonText: "text-slate-700 font-medium",
    formFieldLabel: "text-slate-700",
    footerActionLink: "text-[#1E3A5F] hover:text-[#1E3A5F]/80 font-medium",
    footerActionText: "text-slate-500",
    dividerText: "text-slate-400",
    logoImage: "h-9 w-auto",
    formButtonPrimary:
      "bg-[#0a1a33] hover:bg-[#0a1a33]/90 text-white font-medium",
    formFieldInput: "bg-white border-slate-200",
    dividerLine: "bg-slate-200",
  },
};

// Override the Clerk-instance application name ("Asset Manager") so the auth
// screens carry the product brand. German matches the product's primary audience.
export const clerkLocalization = {
  signIn: {
    start: {
      title: "Bei LPO Controlling Center anmelden",
      subtitle: "Willkommen zurück – bitte melden Sie sich an",
    },
  },
  signUp: {
    start: {
      title: "Konto bei LPO Controlling Center erstellen",
      subtitle: "Erstellen Sie Ihr Konto, um loszulegen",
    },
  },
};

// Own-brand sign-in: the only active auth method is Microsoft OAuth, so this
// is a single-button redirect flow (no email/password fields) styled with the
// app's own design tokens instead of Clerk's prebuilt <SignIn> UI.
export function SignInPage() {
  const { t } = useTranslation();
  const clerkSignIn = useSignIn();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMicrosoftSignIn = async () => {
    if (!clerkSignIn.isLoaded || busy) return;
    setBusy(true);
    setError(null);
    try {
      await clerkSignIn.signIn.authenticateWithRedirect({
        strategy: "oauth_microsoft",
        redirectUrl: `${basePath}/sso-callback`,
        redirectUrlComplete: basePath || "/",
      });
    } catch (err) {
      console.error("[auth] Microsoft sign-in redirect failed", err);
      setError(t("signin_error"));
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-200 text-center">
        <div className="mb-6 flex items-center justify-center gap-3">
          <img src={`${basePath}/logo.svg`} alt="LPO Controlling Center" className="h-9 w-auto" />
        </div>

        <h1 className="text-xl font-semibold text-slate-900" data-testid="text-signin-title">{t("signin_title")}</h1>
        <p className="mt-1.5 text-sm text-slate-500" data-testid="text-signin-subtitle">{t("signin_subtitle")}</p>

        <Button
          type="button"
          className="mt-6 w-full"
          onClick={handleMicrosoftSignIn}
          disabled={!clerkSignIn.isLoaded || busy}
          data-testid="button-signin-microsoft"
        >
          {busy ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("signin_redirecting")}
            </>
          ) : (
            t("signin_microsoft")
          )}
        </Button>

        {error && <p className="mt-4 text-sm text-rose-600" data-testid="text-signin-error">{error}</p>}
      </div>
    </div>
  );
}

// Email/password sign-up has no active auth method behind it (Microsoft OAuth
// only, single-tenant in practice — see NoAccess.tsx). Keep the /sign-up route
// alive (Clerk's OAuth flow may still reference it) but send visitors to the
// real sign-in screen.
export function SignUpPage() {
  return <Redirect to="/sign-in" replace />;
}
