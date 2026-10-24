// Runs after `next build`. Next's own precompiled client code uses syntax that Safari 16.0-16.3
// can't parse (e.g. class static blocks, Safari 16.4+). One unparseable chunk stops the whole page
// from hydrating, so buttons/forms/terminal do nothing. This rewrites only the chunks that need it.
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { transform } from "esbuild";

const dir = path.join(process.cwd(), ".next", "static");
const TARGET = "safari16.0";

async function* walk(d) {
  for (const e of await readdir(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (p.endsWith(".js")) yield p;
  }
}

let changed = 0;
for await (const file of walk(dir)) {
  const src = await readFile(file, "utf8");
  const modern = (await transform(src, { target: "esnext", minify: true })).code;
  const lowered = (await transform(src, { target: TARGET, minify: true })).code;
  if (modern !== lowered) {
    await writeFile(file, lowered);
    changed++;
    console.log("[safari] lowered", path.relative(process.cwd(), file));
  }
}
console.log(`[safari] done, ${changed} file(s) rewritten`);
