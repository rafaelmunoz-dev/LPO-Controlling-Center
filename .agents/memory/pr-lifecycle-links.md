---
name: PR lifecycle cross-links
description: Purchase requests link to bank transactions and inventory items; referential integrity must be maintained on delete paths.
---

# Purchase request lifecycle cross-links

PurchaseRequest carries optional back-reference fields (`bankTransactionId`, `inventoryItemId`, plus `paidAt`) that connect a PR to the BankTransaction created on payment and the InventoryItem created on transfer. The lifecycle UI derives each stage's state from PR status + the linked records.

**Rule:** any store action that deletes a BankTransaction or InventoryItem MUST clear the matching back-reference on every PurchaseRequest (set the id field to undefined).

**Why:** `payPurchaseRequest` refuses to run when `bankTransactionId` is already set, and `transferPurchaseRequestToInventory` refuses when `inventoryItemId` is set. If a linked record is deleted without clearing the PR link, the PR is orphaned and that lifecycle step becomes permanently unrecoverable.

**How to apply:** kept in `removeBankTransaction` / `removeInventoryItem` in `use-app-context.tsx`. Mirror this for any future action that removes a linked finance/inventory record.

**Permissions:** lifecycle stage gating reuses canonical governance constants, NOT ad-hoc role arrays — approve = APPROVER_ROLES, pay = UPLOAD_ROLES, book category = UPLOAD_PROCESS_ROLES (Controller only, matches Belege booking), inventory transfer = INVENTORY_EDIT_ROLES. The three pay/categorize/transfer actions return boolean; toasts must be gated on that success flag.
