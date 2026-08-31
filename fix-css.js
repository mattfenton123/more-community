const fs = require('fs');
let c = fs.readFileSync('app/src/index.css'); // read as buffer
// We have utf-16 bytes at the end. We'll just read as utf-8, find the last valid brace and slice it.
let str = c.toString('utf8');
const lastBrace = str.lastIndexOf('}');
str = str.substring(0, lastBrace + 1) + '\n\n[data-theme="light"] .theme-invert { filter: invert(1); }\n';
fs.writeFileSync('app/src/index.css', str);
