# AI agent setup: circleone-frontend plugin

The frontend standards are packaged as a plugin in [`claude-plugin/circleone-frontend/`](./claude-plugin/circleone-frontend/). This repo is the marketplace for both **Claude Code** and **Cursor**. Once installed, the agent loads the standards whenever it writes or reviews frontend code — no prompting needed.

**Why a plugin instead of a plain skill?** A skill copied into each project's `.claude/skills/` or `.cursor/skills/` goes stale the moment the guidelines change. A plugin is installed from this repo, so every project gets one install, centralized updates on every commit, and team auto-enable.

## One-time setup (repo maintainer)

Marketplace manifests live at the **root** of `Development-Guidelines` (not inside `frontend/`):

- Claude Code: `.claude-plugin/marketplace.json`
- Cursor: `.cursor-plugin/marketplace.json`

The plugin directory also has both manifests:

- `.claude-plugin/plugin.json`
- `.cursor-plugin/plugin.json`

**1. Claude Code marketplace file** (`.claude-plugin/marketplace.json`):

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

**2. Cursor marketplace file** (`.cursor-plugin/marketplace.json`):

```json
{
  "name": "circleone",
  "owner": { "name": "Circleone Frontend Team" },
  "metadata": {
    "description": "Circleone internal Cursor plugins"
  },
  "plugins": [
    {
      "name": "circleone-frontend",
      "source": "./frontend/claude-plugin/circleone-frontend",
      "description": "Circleone frontend standards: architecture, TypeScript, components, styling, forms, naming, a11y, performance, security, testing",
      "category": "standards",
      "keywords": ["frontend", "react", "nextjs", "vite", "typescript", "expo"]
    }
  ]
}
```

**3. Validate and test Claude Code locally** from the repo root:

```bash
claude plugin validate .
claude plugin marketplace add /path/to/Development-Guidelines
claude plugin install circleone-frontend@circleone
```

Then in any Claude Code session, ask something like *"How should I wire a select field in a form?"* — Claude should consult the skill and answer from `code/forms.md`. You can also invoke it explicitly with `/circleone-frontend:frontend-standards`.

**4. Commit and push.** After local testing, remove the local Claude marketplace (`claude plugin marketplace remove circleone`) and re-add from GitHub (below).

## Claude Code: adding it to a project (recommended: team auto-install)

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

## Claude Code: adding it manually (individual developer)

```bash
claude plugin marketplace add EMSCompany/Development-Guidelines
claude plugin install circleone-frontend@circleone
```

Or interactively inside Claude Code with `/plugin marketplace add EMSCompany/Development-Guidelines` then `/plugin install circleone-frontend@circleone`.

## Cursor: team marketplace (recommended)

Cursor distributes this plugin through a **team marketplace**, not per-project `extraKnownMarketplaces`. A Teams/Enterprise admin does this once:

1. Open [Cursor Dashboard → Plugins](https://cursor.com/dashboard?tab=plugins).
2. Under **Team Marketplaces**, click **Add Marketplace** → **Import from Repo**.
3. Paste `https://github.com/EMSCompany/Development-Guidelines`.
4. Confirm `circleone-frontend` is listed, then save.
5. Under **Marketplace Settings**, turn on **Enable Auto Refresh**.
6. Set the plugin to **Default On** or **Required** so teammates get it without a manual install.

Auto Refresh needs the [Cursor GitHub App](https://cursor.com/docs/integrations/github.md) installed on `EMSCompany` with access to `Development-Guidelines`. Cursor re-indexes at most once every 10 minutes after a push to the tracked branch. Teammates pick up updates on the next window focus or **Developer: Reload Window**.

After the marketplace is imported, enable the plugin in each frontend repo with `.cursor/settings.json`:

```json
{
  "plugins": {
    "circleone-frontend": {
      "enabled": true
    }
  }
}
```

Skip this file if the marketplace plugin is **Required**.

## Cursor: local testing (individual developer)

For a checkout that is not yet on the team marketplace, copy or clone the plugin into `~/.cursor/plugins/local/circleone-frontend` so that folder contains `.cursor-plugin/plugin.json` and `skills/`. Then reload the Cursor window.

Do not use `/add-plugin` for this repo: it pins a stale git ref and Update/Reinstall will not move it forward.

## Private repo note

Manual Claude Code installs use your normal git credentials (`gh auth login` is enough). For Claude background auto-updates, each dev should have `GITHUB_TOKEN` (or `GH_TOKEN`) with read access exported in their shell. In CI, GitHub Actions provides `GITHUB_TOKEN` automatically for same-org repos.

Cursor team marketplace import of a private repo uses the Cursor GitHub App, not `GITHUB_TOKEN`.

## Updating the standards

The plugin bundles **generated copies** of the guideline files (installed plugins can't read outside their own directory), in two layers: `rules/` — compact digests with the ✅/❌ example blocks stripped, which the skill reads by default — and `references/` — verbatim copies, opened on demand when an example is needed. `tooling/` is deliberately excluded; editor/lint setup is enforced by CI, not by the agent. Whenever guidelines change:

```bash
node frontend/claude-plugin/circleone-frontend/scripts/sync-references.mjs
```

Commit the regenerated `rules/` and `references/` together with the guideline change. Because the plugin omits a `version` field, every commit counts as a new version. Claude Code users pick it up on auto-update or `/plugin marketplace update circleone`. Cursor users pick it up from team marketplace Auto Refresh (or a manual **Refresh** on the marketplace).

To keep the copies from drifting, add this CI check to this repo:

```bash
node frontend/claude-plugin/circleone-frontend/scripts/sync-references.mjs
git diff --exit-code frontend/claude-plugin
```

## Known gaps

`README.md` references `code/state-and-data.md`, which doesn't exist yet. The skill tells Claude to flag that topic as uncovered; once written, the sync script picks up new `code/` files automatically (new top-level files must be added to the `include` list in the sync script and to the routing table in `SKILL.md` — as was done for `testing.md`).