// Disposable teaching deployment: one origin serves static React and proxies API.
// Production hosting needs its own TLS, secret management, monitoring and backups.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
require('../backend/dist/server.js');
const webRoot = path.resolve(__dirname, '../frontend/build');
const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.ico': 'image/x-icon', '.svg': 'image/svg+xml' };
http.createServer((req, res) => {
  if (req.url.startsWith('/api/')) {
    const proxy = http.request({ hostname: '127.0.0.1', port: Number(process.env.PORT), path: req.url, method: req.method, headers: req.headers }, api => {
      res.writeHead(api.statusCode, api.headers); api.pipe(res);
    });
    proxy.on('error', () => { res.writeHead(502); res.end('API is not ready'); });
    req.pipe(proxy); return;
  }
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://demo').pathname); }
  catch { res.writeHead(400); res.end(); return; }
  const candidate = path.resolve(webRoot, '.' + pathname);
  if (!candidate.startsWith(webRoot + path.sep) && candidate !== webRoot) {
    res.writeHead(403); res.end(); return;
  }
  const file = fs.existsSync(candidate) && fs.statSync(candidate).isFile() ? candidate : path.join(webRoot, 'index.html');
  res.writeHead(200, { 'content-type': mime[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(3000, '0.0.0.0', () => console.log('Demo web origin listening on 3000'));
