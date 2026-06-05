import { SignIn, SignUp } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";

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
    fontFamily: "'Inter', system-ui, sans-serif",
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
    footerActionLink: "text-teal-600 hover:text-teal-700 font-medium",
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

export function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50 px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

export function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50 px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}
