#!/usr/bin/env node
/**
 * Post-build step for @eger/shared:
 *   - Renames `dist-cjs/*.js`  → `.cjs`
 *   - Renames `dist-cjs/*.d.ts` → `.d.cts`
 *   - Strips `.js.map` / `.d.ts.map`
 *   - Rewrites internal `'./foo.js'` → `'./foo.cjs'` and `./foo.d.ts` → `./foo.d.cts`
 *
 * This is needed because the package declares `"type": "module"`, so Node
 * treats any `.js` file as ESM. The CommonJS build must use `.cjs`.
 */
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', 'dist-cjs');

function walk(dir, fn) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, fn);
    } else {
      fn(full);
    }
  }
}

let renamed = 0;
let stripped = 0;

// Rename .js → .cjs
walk(root, (p) => {
  if (p.endsWith('.js')) {
    fs.renameSync(p, p.slice(0, -3) + '.cjs');
    renamed++;
  } else if (p.endsWith('.js.map')) {
    fs.unlinkSync(p);
    stripped++;
  } else if (p.endsWith('.d.ts')) {
    fs.renameSync(p, p.slice(0, -5) + '.d.cts');
    renamed++;
  } else if (p.endsWith('.d.ts.map')) {
    fs.unlinkSync(p);
    stripped++;
  }
});

// Rewrite imports inside .cjs and .d.cts files — both single + double
// quoted, both relative ./ and ../ prefixes, and both require(...) + from "...".
const patterns = [
  // require("./foo.js") and require("../foo.js")
  [/require\(("|\')\.(\.[\/\\][^"']+?)\.js\1/g, 'require($1$2.cjs$1'],
  // from "./foo.js"  and  from "../foo.js"
  [/from ("|\')\.(\.[\/\\][^"']+?)\.js\1/g, 'from $1$2.cjs$1'],
  // Type references in .d.cts files
  [/("|\')\.(\.[\/\\][^"']+?)\.d\.ts\1/g, '$1$2.d.cts$1'],
];
let rewritten = 0;
walk(root, (p) => {
  if (!p.endsWith('.cjs') && !p.endsWith('.cts')) return;
  let c = fs.readFileSync(p, 'utf8');
  let c2 = c;
  for (const [pat, repl] of patterns) {
    c2 = c2.replace(pat, repl);
  }
  if (c2 !== c) {
    fs.writeFileSync(p, c2);
    rewritten++;
  }
});

// eslint-disable-next-line no-console
console.log(
  `postbuild-cjs: renamed=${renamed} stripped=${stripped} rewritten=${rewritten}`,
);