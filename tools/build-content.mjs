// Builds public/bd-content.js from public/bd-content.json, so the page can load the content without a fetch.
// Change wording in bd-content.json, then run: node tools/build-content.mjs
import { readFileSync, writeFileSync } from 'node:fs';
const json = readFileSync(new URL('../public/bd-content.json', import.meta.url), 'utf8');
JSON.parse(json);
writeFileSync(new URL('../public/bd-content.js', import.meta.url), '/* Built from bd-content.json by tools/build-content.mjs. Do not edit. */\nwindow.BD_CONTENT = ' + json.trim() + ';\n');
console.log('bd-content.js written');
