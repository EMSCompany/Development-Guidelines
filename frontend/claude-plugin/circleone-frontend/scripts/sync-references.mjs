// Syncs the guideline markdown files from Development-Guidelines/frontend/
// into the plugin, generating two layers:
//
//   skills/frontend-standards/rules/       - compact digests: full text minus
//                                            example code blocks (the ones
//                                            marked with the check/cross
//                                            emoji). What the skill reads by
//                                            default.
//   skills/frontend-standards/references/  - verbatim copies with all
//                                            examples. Read on demand when a
//                                            pattern is ambiguous.
//
// Fenced code blocks WITHOUT an example marker (e.g. the required tsconfig
// flags) are normative and stay in the digest.
//
// Why copies at all: installed plugins are cached and cannot read files
// outside their own directory. Run after every guideline change:
//
//   node frontend/claude-plugin/circleone-frontend/scripts/sync-references.mjs

import {
  cpSync,
  rmSync,
  mkdirSync,
  existsSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const pluginRoot = resolve(here, "..");
// plugin lives at frontend/claude-plugin/circleone-frontend -> frontend/ is 2 up
const guidelinesRoot = resolve(pluginRoot, "..", "..");
const skillRoot = join(pluginRoot, "skills", "frontend-standards");
const refDest = join(skillRoot, "references");
const rulesDest = join(skillRoot, "rules");

// Example markers used in the guidelines (white check mark / cross mark).
const CHECK = "✅";
const CROSS = "❌";

// What to bundle. Excluded on purpose: tooling/ (editor + lint setup doesn't
// change how code is written; lint enforces itself), README.md (SKILL.md is
// the router), temp-front.md (authoring notes). New files inside included
// directories are picked up automatically; new top-level files must be listed
// here AND added to the routing table in SKILL.md.
const include = [
  "conventions.md",
  "accessibility.md",
  "performance.md",
  "security.md",
  "testing.md", // not written yet; copied automatically once it exists
  "architecture",
  "code",
];

// --- helpers ---------------------------------------------------------------

/** Strip fenced code blocks that contain an example marker. */
function digest(markdown) {
  const lines = markdown.split("\n");
  const out = [];
  let fence = null; // buffered lines of the open fenced block
  for (const line of lines) {
    if (line.trimStart().startsWith("```")) {
      if (fence === null) {
        fence = [line];
      } else {
        fence.push(line);
        const block = fence.join("\n");
        if (!block.includes(CHECK) && !block.includes(CROSS)) out.push(block);
        fence = null;
      }
      continue;
    }
    if (fence !== null) fence.push(line);
    else out.push(line);
  }
  if (fence !== null) out.push(fence.join("\n")); // unclosed fence: keep as-is
  return out.join("\n").replace(/\n{3,}/g, "\n\n");
}

function* mdFiles(root, prefix = "") {
  for (const entry of readdirSync(join(root, prefix))) {
    const rel = prefix ? prefix + "/" + entry : entry;
    if (statSync(join(root, rel)).isDirectory()) yield* mdFiles(root, rel);
    else if (entry.endsWith(".md")) yield rel;
  }
}

function clear(dir) {
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {
    console.warn(
      "warning: could not clear " + dir + " - overwriting in place. If " +
        "guideline files were deleted or renamed, remove stale copies manually.",
    );
  }
  mkdirSync(dir, { recursive: true });
}

// --- sync ------------------------------------------------------------------

clear(refDest);
clear(rulesDest);

let copied = 0;
for (const item of include) {
  const src = join(guidelinesRoot, item);
  if (!existsSync(src)) {
    console.warn("skip (missing): " + item);
    continue;
  }
  cpSync(src, join(refDest, item), { recursive: true });
  copied++;
}

let digested = 0;
for (const rel of mdFiles(refDest)) {
  const depth = rel.split("/").length; // rules/<rel> -> back out `depth` dirs
  const fullPath = "../".repeat(depth) + "references/" + rel;
  const header =
    "> Auto-generated rules digest; example blocks are stripped. When a " +
    "rule is ambiguous or you need to see the correct/incorrect pattern, " +
    "read the full file: " + fullPath + "\n\n";
  const src = readFileSync(join(refDest, rel), "utf8");
  const outPath = join(rulesDest, rel);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, header + digest(src));
  digested++;
}

console.log(
  "Synced " + copied + " entries -> references/, generated " +
    digested + " digests -> rules/",
);
console.log("Remember to commit both directories.");
