---
name: Microsoft Forms via OneDrive
description: How Microsoft Forms data is read in the Controlling Center
---
There is no dedicated Replit "Microsoft Forms" connector. Microsoft Forms has no public Graph API for reading responses.

**Approach:** A Form's responses are stored in an Excel workbook in the creator's OneDrive ("Open in Excel"). Read those workbooks through the Microsoft Graph Excel API using the **Microsoft OneDrive** connector (`connector:ccfg_onedrive_...`). Token is fetched from the Replit connectors proxy with `connector_names=onedrive` and `settings.access_token` (standard pattern; reconcile against the real snippet after OAuth).

**Why:** Forms→PR import needs real response rows; OneDrive Excel is the only first-party path available via existing connectors.

**How to apply:** Extending to more Microsoft surfaces (Teams/Outlook/SharePoint/Planner) reuses the same onedrive token but likely needs broader Graph scopes (Mail.Send, Sites, Tasks), which requires user re-authorization.
