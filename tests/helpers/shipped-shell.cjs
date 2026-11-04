'use strict';
// Source-contract tests need the actual current owner body regardless of its
// packaging. Resolve only explicitly extracted owners, at their HTML position.
// This does not modify browser fixtures, filesystem reads, or source hashes.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
function expandExtractedOwners(html, root) {
  return html.replace(/<script\b[^>]*data-sukun-extracted="[^"]+"[^>]*>\s*<\/script>|<link\b[^>]*data-sukun-extracted="[^"]+"[^>]*>/g, tag => {
    const owner = tag.match(/data-sukun-extracted="([^"]+)"/)[1];
    const url = tag.match(/(?:src|href)="([^"]+)"/)?.[1];
    if (!url || !url.startsWith('./')) throw Error('Invalid extracted source URL: ' + owner);
    const relative = url.split(/[?#]/, 1)[0].slice(2);
    if (relative.split('/').some(part => !part || part === '..' || part === '.') || relative.includes('\\')) throw Error('Unsafe source path');
    const file = path.resolve(root, relative);
    if (!file.startsWith(path.resolve(root) + path.sep)) throw Error('Source escaped checkout');
    const bytes = fs.readFileSync(file);
    const expected = tag.match(/data-sukun-source-sha256="([a-f0-9]{64})"/)?.[1];
    if (!expected || crypto.createHash('sha256').update(bytes).digest('hex') !== expected) throw Error('Extracted source digest mismatch: ' + owner);
    if (tag.startsWith('<script')) {
      if (/\s(?:async|defer|type)\b/.test(tag)) throw Error('Extracted classic owner mode changed: ' + owner);
      return '<script id="' + owner + '">' + bytes.toString('utf8') + '</script>';
    }
    return '<style' + (owner === 'legacy-base-style-r1215' ? '' : ' id="' + owner + '"') + '>' + bytes.toString('utf8') + '</style>';
  });
}
function readShippedShell(file) {
  const absolute = path.resolve(file);
  return expandExtractedOwners(fs.readFileSync(absolute, 'utf8'), path.dirname(absolute));
}
module.exports = { readShippedShell, expandExtractedOwners };
