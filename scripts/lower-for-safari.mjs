// Runs after `next build`. Next's own precompiled client code uses syntax that Safari 16.0-16.3
// can't parse (e.g. class static blocks, Safari 16.4+). One unparseable chunk stops the whole page
// from hydrating, so buttons/forms/terminal do nothing. This rewrites only the chunks that need it.
//
// Rewritten chunks are also RENAMED (new content hash) everywhere they are referenced. Otherwise the
// fixed file would sit at the same URL as the broken one, and a CDN (Vercel/Cloudflare) or browser
// that cached the old one for a year ("immutable") would keep serving it.
import { createHash } from "node:crypto";
import { readdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { transform } from "esbuild";

const root = path.join(process.cwd(), ".next");
const staticDir = path.join(root, "static");
const TARGET = "safari16.0";

async function* walk(d, test) {
  for (const e of await readdir(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) {
      if (e.name === "cache" || e.name === "node_modules") continue;
      yield* walk(p, test);
    } else if (test(p)) yield p;
  }
}

const renames = []; // [oldBase, newBase]
for await (const file of walk(staticDir, (p) => p.endsWith(".js"))) {
  const src = await readFile(file, "utf8");
  const modern = (await transform(src, { target: "esnext", minify: true })).code;
  const lowered = (await transform(src, { target: TARGET, minify: true })).code;
  if (modern === lowered) continue;
  const oldBase = path.basename(file, ".js");
  const newBase = createHash("sha1").update(lowered).digest("hex").slice(0, oldBase.length);
  await writeFile(file, lowered);
  await rename(file, path.join(path.dirname(file), newBase + ".js"));
  renames.push([oldBase, newBase]);
  console.log(`[safari] lowered ${oldBase}.js -> ${newBase}.js`);
}

if (renames.length) {
  const textual = /\.(js|json|html|rsc|segment\.rsc|txt|map|css|mjs|cjs)$/;
  let touched = 0;
  for await (const file of walk(root, (p) => textual.test(p))) {
    let text = await readFile(file, "utf8");
    let next = text;
    for (const [from, to] of renames) next = next.split(from).join(to);
    if (next !== text) {
      await writeFile(file, next);
      touched++;
    }
  }
  console.log(`[safari] updated references in ${touched} file(s)`);
}
console.log(`[safari] done, ${renames.length} chunk(s) rewritten`);
