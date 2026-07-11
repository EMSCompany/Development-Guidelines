# AI agent setup: circleone-frontend plugin

The frontend standards are packaged as a **Claude Code plugin** in [`claude-plugin/circleone-frontend/`](./claude-plugin/circleone-frontend/). Once installed, Claude automatically loads the standards whenever it writes or reviews frontend code — no prompting needed.

**Why a plugin instead of a plain skill?** A skill copied into each project's `.claude/skills/` goes stale the moment the guidelines change. A plugin is installed from this repo (which acts as a *plugin marketplace*), so every project gets one install command, centralized updates on every commit, and per-project auto-enable for the whole team.

## One-time setup (repo maintainer)

**1. Add the marketplace file** at the **root** of the `Development-Guidelines` repo (not inside `frontend/`), at `.claude-plugin/marketplace.json`:

```json
{
  "name": "circleone",
  "owner": { "name": "Circleone Frontend Team" },
  "description": "Circleone internal Claude Code plugins",
  "plugins": [
    {
      "name": "circleone-frontend",
      "source": "./frontend/claude-plugin/circleone-frontend",
      "description": "Circleone frontend standards: architecture, TypeScript, components, styling, forms, naming, a11y, performance, security, tooling",
      "category": "standards",
      "keywords": ["frontend", "react", "nextjs", "vite", "typescript"]
    }
  ]
}
```

**2. Validate and test locally** from the repo root:

```bash
claude plugin validate .
claude plugin marketplace add /path/to/Development-Guidelines
claude plugin install circleone-frontend@circleone
```

Then in any Claude Code session, ask something like *"How should I wire a select field in a form?"* — Claude should consult the skill and answer from `code/forms.md`. You can also invoke it explicitly with `/circleone-frontend:frontend-standards`.

**3. Commit and push.** After local testing, remove the local marketplace (`claude plugin marketplace remove circleone`) and re-add from GitHub (below).

## Adding it to a project (recommended: team auto-install)

In each frontend project repo, commit `.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "circleone": {
      "source": {
        "source": "github",
        "repo": "EMSCompany/Development-Guidelines"
      }
    }
  },
  "enabledPlugins": {
    "circleone-frontend@circleone": true
  }
}
```

Everyone who opens the project in Claude Code and trusts the folder is prompted to install the marketplace, and the plugin is enabled automatically. New teammates get the standards with zero setup.

## Adding it manually (individual developer)

```bash
claude plugin marketplace add EMSCompany/Development-Guidelines
claude plugin install circleone-frontend@circleone
```

Or interactively inside Claude Code with `/plugin marketplace add EMSCompany/Development-Guidelines` then `/plugin install circleone-frontend@circleone`.

## Private repo note

Manual installs use your normal git credentials (`gh auth login` is enough). For background auto-updates, each dev should have `GITHUB_TOKEN` (or `GH_TOKEN`) with read access exported in their shell. In CI, GitHub Actions provides `GITHUB_TOKEN` automatically for same-org repos.

## Updating the standards

The plugin bundles **generated copies** of the guideline files (installed plugins can't read outside their own directory), in two layers: `rules/` — compact digests with the ✅/❌ example blocks stripped, which the skill reads by default — and `references/` — verbatim copies, opened on demand when an example is needed. `tooling/` is deliberately excluded; editor/lint setup is enforced by CI, not by the agent. Whenever guidelines change:

```bash
node frontend/claude-plugin/circleone-frontend/scripts/sync-references.mjs
```

Commit the regenerated `rules/` and `references/` together with the guideline change. Because the plugin omits a `version` field, every commit counts as a new version — users pick it up on auto-update or `/plugin marketplace update circleone`.

To keep the copies from drifting, add this CI check to this repo:

```bash
node frontend/claude-plugin/circleone-frontend/scripts/sync-references.mjs
git diff --exit-code frontend/claude-plugin
```

## Other AI tools (Cursor, etc.)

The plugin is Claude Code-specific, but the same source files work elsewhere: point Cursor at the guidelines via `.cursor/rules/` referencing this repo's markdown files, or add a short pointer in each project's `AGENTS.md` / `CLAUDE.md`: *"Follow the Circleone frontend standards; if the circleone-frontend plugin is installed, use its frontend-standards skill."*

## Known gaps

`README.md` references `code/state-and-data.md`, which doesn't exist yet. The skill tells Claude to flag that topic as uncovered; once written, the sync script picks up new `code/` files automatically (new top-level files must be added to the `include` list in the sync script and to the routing table in `SKILL.md` — as was done for `testing.md`).