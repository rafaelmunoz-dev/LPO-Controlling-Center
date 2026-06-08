// Microsoft Graph access via the Replit "Microsoft OneDrive" connector.
//
// Microsoft Forms has no public Graph API for reading responses; instead, a
// Form's responses are stored in an Excel workbook in the creator's OneDrive
// ("Open in Excel"). We therefore read those workbooks through the Graph Excel
// API and project each data row into a normalized form response that the
// purchase-request import can consume.
//
// The OAuth token is fetched fresh from the Replit connectors proxy on every
// call (tokens expire) — never cache the client/token long-term.

const GRAPH = "https://graph.microsoft.com/v1.0";

// Replit injects these. REPLIT_CONNECTORS_HOSTNAME points at the credential
// proxy; the identity header authorizes this Repl/deployment to read secrets.
function replitToken(): string | null {
  if (process.env.REPL_IDENTITY) return "repl " + process.env.REPL_IDENTITY;
  if (process.env.WEB_REPL_RENEWAL) return "depl " + process.env.WEB_REPL_RENEWAL;
  return null;
}

export class MicrosoftNotConnectedError extends Error {
  constructor() {
    super("microsoft_not_connected");
    this.name = "MicrosoftNotConnectedError";
  }
}

interface ConnectionSettings {
  access_token?: string;
  oauth?: { credentials?: { access_token?: string } };
}

interface ConnectionResponse {
  items?: { settings?: ConnectionSettings }[];
}

// Returns a Microsoft Graph access token, or null if no live connection.
export async function getMicrosoftAccessToken(): Promise<string | null> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = replitToken();
  if (!hostname || !xReplitToken) return null;

  try {
    const res = await fetch(
      `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=onedrive`,
      { headers: { Accept: "application/json", X_REPLIT_TOKEN: xReplitToken } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as ConnectionResponse;
    const settings = data.items?.[0]?.settings ?? {};
    return (
      settings.access_token ??
      settings.oauth?.credentials?.access_token ??
      null
    );
  } catch {
    return null;
  }
}

export async function isMicrosoftConnected(): Promise<boolean> {
  return (await getMicrosoftAccessToken()) !== null;
}

async function graphGet<T>(path: string): Promise<T> {
  const token = await getMicrosoftAccessToken();
  if (!token) throw new MicrosoftNotConnectedError();
  const res = await fetch(`${GRAPH}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  if (res.status === 401 || res.status === 403) {
    throw new MicrosoftNotConnectedError();
  }
  if (!res.ok) {
    throw new Error(`graph_error_${res.status}`);
  }
  return (await res.json()) as T;
}

export interface MsFormFile {
  id: string;
  name: string;
  lastModified: string;
}

interface DriveItem {
  id: string;
  name?: string;
  lastModifiedDateTime?: string;
  file?: { mimeType?: string };
}

// Lists candidate Excel workbooks from the user's OneDrive. These back
// Microsoft Forms response exports; the caller picks one to import from.
export async function listFormWorkbooks(): Promise<MsFormFile[]> {
  const data = await graphGet<{ value?: DriveItem[] }>(
    "/me/drive/root/search(q='.xlsx')?$select=id,name,lastModifiedDateTime,file&$top=50",
  );
  return (data.value ?? [])
    .filter((f) => f.file && (f.name ?? "").toLowerCase().endsWith(".xlsx"))
    .map((f) => ({
      id: f.id,
      name: f.name ?? f.id,
      lastModified: f.lastModifiedDateTime ?? "",
    }));
}

export interface MsFormResponse {
  id: string;
  form: string;
  respondent: string;
  submittedAt: string;
  fields: { label: string; value: string }[];
}

interface Worksheet {
  id: string;
  name: string;
}

interface UsedRange {
  values?: (string | number | boolean | null)[][];
}

const cell = (v: string | number | boolean | null | undefined): string =>
  v === null || v === undefined ? "" : String(v).trim();

// Heuristics for Microsoft Forms' default export columns so we can pull out a
// sensible respondent + timestamp; everything else becomes a labeled field.
const RESPONDENT_HEADERS = ["name", "email", "email address", "respondent"];
const TIME_HEADERS = ["completion time", "submitted", "start time"];
const META_HEADERS = ["id", "start time", "completion time", "email", "name"];

// Reads the first worksheet of a workbook and projects each data row into a
// normalized form response. Returns the worksheet/file name as the form name.
export async function readFormResponses(
  fileId: string,
  fileName: string,
): Promise<{ form: string; responses: MsFormResponse[] }> {
  const sheets = await graphGet<{ value?: Worksheet[] }>(
    `/me/drive/items/${encodeURIComponent(fileId)}/workbook/worksheets?$select=id,name`,
  );
  const sheet = sheets.value?.[0];
  if (!sheet) return { form: fileName, responses: [] };

  const range = await graphGet<UsedRange>(
    `/me/drive/items/${encodeURIComponent(fileId)}/workbook/worksheets/${encodeURIComponent(sheet.id)}/usedRange(valuesOnly=true)?$select=values`,
  );
  const rows = range.values ?? [];
  if (rows.length < 2) return { form: fileName, responses: [] };

  const headers = rows[0].map((h) => cell(h));
  const lower = headers.map((h) => h.toLowerCase());
  const respondentIdx = lower.findIndex((h) => RESPONDENT_HEADERS.includes(h));
  const timeIdx = lower.findIndex((h) => TIME_HEADERS.includes(h));

  const responses: MsFormResponse[] = rows.slice(1).map((row, i) => {
    const values = headers.map((_, c) => cell(row[c]));
    const fields = headers
      .map((label, c) => ({ label, value: values[c] }))
      .filter((f) => f.label && !META_HEADERS.includes(f.label.toLowerCase()));
    return {
      id: `${fileId}:${i}`,
      form: fileName,
      respondent: respondentIdx >= 0 && values[respondentIdx] ? values[respondentIdx] : "—",
      submittedAt: timeIdx >= 0 ? values[timeIdx] : "",
      fields,
    };
  });

  return { form: fileName, responses };
}
