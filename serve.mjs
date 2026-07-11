#!/usr/bin/env node
// Zero-dependency static server for the EV Site Planner suite.
// Serves ./public over http with correct MIME types and tolerant URL decoding
// (the suite ships pages whose filenames contain spaces and "&", e.g.
// "Quotes & Invoices.dc.html", reached as "Quotes%20%26%20Invoices.dc.html").
//
//   node serve.mjs            -> http://localhost:8000
//   PORT=3000 node serve.mjs  -> http://localhost:3000

import { createServer } from 'node:http';
import { stat, readFile } from 'node:fs/promises';
import { join, normalize, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), 'public');
const ROOT_PREFIX = ROOT.endsWith(sep) ? ROOT : ROOT + sep;
const PORT = Number(process.env.PORT) || 8000;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

const server = createServer(async (req, res) => {
  try {
    let path = decodeURIComponent((req.url || '/').split('?')[0].split('#')[0]);
    if (path.endsWith('/')) path += 'index.html';

    // Resolve within ROOT and reject traversal (guard against sibling dirs
    // like "public-evil" by matching on ROOT + path separator).
    const filePath = normalize(join(ROOT, path));
    if (filePath !== ROOT && !filePath.startsWith(ROOT_PREFIX)) {
      res.writeHead(403).end('Forbidden');
      return;
    }

    let info;
    try {
      info = await stat(filePath);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
         .end('404 Not Found: ' + path);
      return;
    }
    const target = info.isDirectory() ? join(filePath, 'index.html') : filePath;
    const body = await readFile(target);
    res.writeHead(200, {
      'Content-Type': TYPES[extname(target).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    }).end(body);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
       .end('500 Server Error: ' + err.message);
  }
});

server.listen(PORT, () => {
  console.log(`EV Site Planner suite serving ${ROOT}`);
  console.log(`  http://localhost:${PORT}`);
});
