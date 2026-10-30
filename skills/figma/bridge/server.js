// Local bridge between Copilot (shell) and the Figma Desktop bridge plugin.
// Usage: node server.js   (prints a session token; paste it into the plugin once)
const http = require('http');
const crypto = require('crypto');

const PORT = Number(process.env.FIGMA_BRIDGE_PORT || 9230);
const TOKEN = process.env.FIGMA_BRIDGE_TOKEN || crypto.randomBytes(16).toString('hex');
const POLL_WAIT_MS = 25000;

const queue = [];
const waiting = new Map();
let pollers = [];
let lastSeen = 0;

function send(res, code, body) {
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Bridge-Token',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => {
      data += c;
      if (data.length > 5e6) reject(new Error('body too large'));
    });
    req.on('end', () => resolve(data ? JSON.parse(data) : {}));
    req.on('error', reject);
  });
}

function dispatch() {
  while (queue.length && pollers.length) {
    const job = queue.shift();
    const res = pollers.shift();
    send(res, 200, job);
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  if (req.headers['x-bridge-token'] !== TOKEN) return send(res, 401, { error: 'bad token' });
  const url = new URL(req.url, 'http://localhost');

  try {
    if (req.method === 'GET' && url.pathname === '/status') {
      return send(res, 200, { connected: Date.now() - lastSeen < POLL_WAIT_MS + 5000 });
    }
    if (req.method === 'GET' && url.pathname === '/poll') {
      lastSeen = Date.now();
      pollers.push(res);
      const t = setTimeout(() => {
        pollers = pollers.filter((p) => p !== res);
        send(res, 200, { idle: true });
      }, POLL_WAIT_MS);
      res.on('close', () => {
        clearTimeout(t);
        pollers = pollers.filter((p) => p !== res);
      });
      return dispatch();
    }
    if (req.method === 'POST' && url.pathname === '/result') {
      const { id, ok, value, error } = await readBody(req);
      const w = waiting.get(id);
      if (w) {
        waiting.delete(id);
        w({ ok, value, error });
      }
      return send(res, 200, {});
    }
    if (req.method === 'POST' && url.pathname === '/run') {
      const { script, timeoutMs = 60000 } = await readBody(req);
      if (typeof script !== 'string' || !script) return send(res, 400, { error: 'script required' });
      if (Date.now() - lastSeen > POLL_WAIT_MS + 5000) {
        return send(res, 503, { error: 'plugin not connected; run the bridge plugin in Figma Desktop' });
      }
      const id = crypto.randomUUID();
      const result = new Promise((resolve) => {
        waiting.set(id, resolve);
        setTimeout(() => {
          if (waiting.delete(id)) resolve({ ok: false, error: 'timeout' });
        }, timeoutMs);
      });
      queue.push({ id, script });
      dispatch();
      return send(res, 200, await result);
    }
    return send(res, 404, { error: 'not found' });
  } catch (e) {
    return send(res, 500, { error: String(e.message || e) });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`figma bridge listening on http://127.0.0.1:${PORT}`);
  console.log(`token: ${TOKEN}`);
});
