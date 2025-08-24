// Node script — run: node scripts/patch-formatters.js
const fs = require("fs");
const path = require("path");
const glob = require("glob");

const repoRoot = path.resolve(__dirname, "..");
const srcDir = path.join(repoRoot, "src");
const utilImportName = "{ formatPriceSafe, splitPriceParts }";
const utilPath = "src/utils/formatPrice";

function computeRelativeImport(fromFile) {
  const fromDir = path.dirname(fromFile);
  let rel = path.relative(fromDir, path.join(repoRoot, utilPath));
  if (!rel.startsWith(".")) rel = "./" + rel;
  // normalize for TSX imports (remove .js if present)
  rel = rel.replace(/\\/g, "/");
  return rel;
}

function ensureImport(content, importPath) {
  const importLine = `import ${utilImportName} from "${importPath}";`;
  // if already imported in some form, leave it
  if (content.includes("formatPriceSafe") || content.includes("splitPriceParts")) return content;
  // find last import block end
  const importMatch = content.match(/(^[\s\S]*?import[^\n]*\n)/m);
  // naive: insert after first import block
  const idx = content.indexOf("import ");
  if (idx === -1) {
    return importLine + "\n" + content;
  } else {
    // place after initial imports group
    const parts = content.split("\n");
    let insertAt = 0;
    for (let i = 0; i < parts.length; i++) {
      if (!parts[i].startsWith("import") && parts[i].trim() !== "") {
        insertAt = i;
        break;
      }
    }
    parts.splice(insertAt, 0, importLine);
    return parts.join("\n");
  }
}

function run() {
  const files = glob.sync(path.join(srcDir, "**/*.tsx"));
  const changed = [];
  files.forEach((file) => {
    let src = fs.readFileSync(file, "utf8");
    let original = src;
    // Replace simple `.toFixed(2)` occurrences: <expr>.toFixed(2) -> formatPriceSafe(<expr>)
    // This is naive and catches many common cases like `price.toFixed(2)` or `(price).toFixed(2)`
    src = src.replace(/([\w\)\]\}]+)\.toFixed\(\s*2\s*\)/g, (m, expr) => {
      return `formatPriceSafe(${expr})`;
    });

    // Replace formatPrice(...) -> formatPriceSafe(...)
    src = src.replace(/\bformatPrice\s*\(/g, "formatPriceSafe(");

    if (src !== original) {
      const bak = file + ".bak";
      fs.writeFileSync(bak, original, "utf8");
      const relImport = computeRelativeImport(file);
      const importPath = relImport.replace(/\/src\/utils\/formatPrice$/, "./utils/formatPrice").replace(/^\.\/\.\//, "./");
      // insert import if not present
      if (!src.includes("formatPriceSafe") || !src.includes("splitPriceParts")) {
        src = ensureImport(src, importPath);
      }
      fs.writeFileSync(file, src, "utf8");
      changed.push(file);
    }
  });

  console.log("Patched files:", changed.length);
  changed.forEach((f) => console.log(" -", f));
  console.log("Backups created as *.bak next to modified files. Inspect changes and run git add/commit.");
}

run();