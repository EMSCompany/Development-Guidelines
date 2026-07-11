# circleone-frontend plugin

Claude Code plugin that makes AI agents follow [Circleone's frontend standards](../../README.md).

## What's inside

- `skills/frontend-standards/SKILL.md` — the skill Claude loads automatically when doing frontend work. It routes Claude to the right rule files per task.
- `skills/frontend-standards/rules/` — **generated** compact digests (all rules, no example code). What Claude reads by default.
- `skills/frontend-standards/references/` — **generated** verbatim copies including the ✅/❌ examples. Claude opens these on demand when a pattern is ambiguous.
- `scripts/sync-references.mjs` — generates both directories from the guideline sources. Never edit `rules/` or `references/` directly.

`tooling/`, `README.md`, and `temp-front.md` are intentionally not bundled — editor/lint setup is enforced by CI, not by the agent.

## Updating

1. Edit the guideline files in `frontend/` as usual (via PR).
2. Run `node frontend/claude-plugin/circleone-frontend/scripts/sync-references.mjs`.
3. Commit the guideline change and the regenerated `rules/` + `references/` in the same PR.

No version bump needed — the plugin omits `version`, so every commit counts as a new release and users get updates automatically.

Setup and installation: see [`frontend/AI-PLUGIN-SETUP.md`](../../AI-PLUGIN-SETUP.md).
