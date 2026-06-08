import { Router, type IRouter } from "express";
import { requireAuth, requireMembership } from "../lib/auth";
import {
  isMicrosoftConnected,
  listFormWorkbooks,
  readFormResponses,
  MicrosoftNotConnectedError,
} from "../lib/microsoft";

const router: IRouter = Router();

// Real connection status for the Microsoft (OneDrive / Forms) integration.
router.get("/microsoft/status", requireAuth, async (_req, res) => {
  const connected = await isMicrosoftConnected();
  res.json({ connected });
});

// Candidate Excel workbooks (Microsoft Forms response exports) in OneDrive.
router.get(
  "/microsoft/forms/files",
  requireAuth,
  requireMembership,
  async (req, res) => {
    try {
      const files = await listFormWorkbooks();
      res.json({ files });
    } catch (err) {
      if (err instanceof MicrosoftNotConnectedError) {
        res.status(409).json({ error: "microsoft_not_connected" });
        return;
      }
      req.log?.error({ err }, "microsoft forms/files failed");
      res.status(502).json({ error: "microsoft_graph_error" });
    }
  },
);

// Normalized form responses read from a chosen workbook.
router.get(
  "/microsoft/forms/responses",
  requireAuth,
  requireMembership,
  async (req, res) => {
    const fileId = typeof req.query.fileId === "string" ? req.query.fileId : "";
    const fileName =
      typeof req.query.fileName === "string" ? req.query.fileName : "Microsoft Forms";
    if (!fileId) {
      res.status(400).json({ error: "fileId required" });
      return;
    }
    try {
      const result = await readFormResponses(fileId, fileName);
      res.json(result);
    } catch (err) {
      if (err instanceof MicrosoftNotConnectedError) {
        res.status(409).json({ error: "microsoft_not_connected" });
        return;
      }
      req.log?.error({ err }, "microsoft forms/responses failed");
      res.status(502).json({ error: "microsoft_graph_error" });
    }
  },
);

export default router;
