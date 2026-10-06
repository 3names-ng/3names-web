// One-off: prints every external module imported anywhere + its imported names.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const EXT = /\.(tsx?|jsx?|mjs|cjs)$/;
const SKIP = new Set(["node_modules", ".next", ".git", ".expo", "android", "assets", "scripts"]);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (EXT.test(name)) out.push(p);
  }
  return out;
}

const files = walk(ROOT);
const modMap = new Map(); // module -> Map(name -> count)

const IMPORT_RE =
  /import\s+(?:type\s+)?([^;]*?)\s+from\s+["']([^"']+)["']|import\s+["']([^"']+)["']|require\(\s*["']([^"']+)["']\s*\)/gs;

for (const file of files) {
  const src = readFileSync(file, "utf8");
  let m;
  while ((m = IMPORT_RE.exec(src))) {
    const mod = m[2] || m[3] || m[4];
    if (!mod) continue;
    if (mod.startsWith(".") || mod.startsWith("@/")) continue;
    const clause = m[1];
    if (!modMap.has(mod)) modMap.set(mod, new Map());
    const names = modMap.get(mod);
    if (clause === undefined) {
      names.set("(side-effect)", (names.get("(side-effect)") || 0) + 1);
      continue;
    }
    const braced = clause.match(/\{([^}]*)\}/s);
    const pre = clause.replace(/\{[^}]*\}/s, "").replace(/,/g, " ").trim();
    const add = (n) => {
      if (!n) return;
      names.set(n, (names.get(n) || 0) + 1);
    };
    if (braced)
      braced[1]
        .split(",")
        .map((s) => s.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[0])
        .filter(Boolean)
        .forEach(add);
    if (pre && pre !== "*") add(pre.startsWith("* as ") ? pre.slice(5) : pre);
    if (pre === "*") add("*");
  }
}

const EXTERNALS = [...modMap.entries()]
  .filter(([mod]) => !mod.startsWith("node:"))
  .sort();

const args = process.argv.slice(2);
const filter = args.length
  ? (mod) => args.some((f) => mod.startsWith(f))
  : () => true;

for (const [mod, names] of EXTERNALS) {
  if (!filter(mod)) continue;
  const sorted = [...names.entries()].sort((a, b) => b[1] - a[1]);
  console.log(`${mod}  (total refs: ${sorted.reduce((s, [, c]) => s + c, 0)})`);
  console.log("   " + sorted.map(([n, c]) => `${n}×${c}`).join("  "));
}
