---
name: Radix Select duplicate-avatar gotcha
description: Radix <SelectValue/> re-renders the full selected <SelectItem> children, so adding your own icon/avatar in the trigger doubles it.
---

In shadcn/Radix `Select`, `<SelectValue/>` does NOT render plain text — it clones and renders the *entire children* of the currently selected `<SelectItem>`. If those items contain an avatar/icon (e.g. `<EntityAvatar/> + label`), that avatar already shows in the trigger.

**Bug pattern:** rendering a second avatar manually inside `<SelectTrigger>` next to `<SelectValue/>` produces TWO icons in the trigger (this caused the "double logo" in the LPO Controlling Center entity selector).

**Fix:** put the avatar only in the `SelectItem` children and let `<SelectTrigger>` contain just `<SelectValue/>`. Do not also render an avatar in the trigger.

**Why:** Radix mirrors the selected option's rendered content into the trigger by design; duplicating it is easy to do by accident when you want the trigger to "show an icon".
