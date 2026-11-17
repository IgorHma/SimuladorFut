const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT) || 3010;
const ROOT = __dirname;
const lobbyStore = new Map();
const eventClients = new Set();
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function json(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
  });
  res.end(JSON.stringify(payload));
}

function makeCode() {
  let code;
  do { code = Array.from({ length: 6 }, () => CODE_CHARS[crypto.randomInt(CODE_CHARS.length)]).join(''); } while (lobbyStore.has(code));
  return code;
}

function publicLobby(lobby) {
  const players = Array.isArray(lobby.players) ? lobby.players : [];
  return { code: lobby.code, name: lobby.name, visibility: lobby.visibility, players: players.length, maxPlayers: lobby.maxPlayers, createdAt: lobby.createdAt, ownerId: lobby.ownerId, started: Boolean(lobby.started), ready: players.filter(player => player.ready).length, playerList: players.map(({ playerId, name, team, ready, owner }) => ({ playerId, name, team, ready, owner })) };
}

function cleanExpired() {
  const limit = Date.now() - 2 * 60 * 60 * 1000;
  for (const [code, lobby] of lobbyStore) if (lobby.createdAt < limit) lobbyStore.delete(code);
}

function listLobbies() {
  cleanExpired();
  return [...lobbyStore.values()].map(publicLobby);
}

function notifyLobbies() {
  const message = `data: ${JSON.stringify({ type: 'lobbies', lobbies: listLobbies() })}\n\n`;
  for (const client of eventClients) client.write(message);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; if (body.length > 10000) req.destroy(); });
    req.on('end', () => { try { resolve(body ? JSON.parse(body) : {}); } catch { reject(new Error('JSON inválido')); } });
    req.on('error', reject);
  });
}

function serveStatic(req, res) {
  const requested = decodeURIComponent(req.url === '/' ? '/index.html' : req.url.split('?')[0]);
  const file = path.resolve(ROOT, `.${requested}`);
  if (!file.startsWith(ROOT)) return json(res, 403, { error: 'Acesso negado' });
  fs.readFile(file, (error, content) => {
    if (error) return json(res, 404, { error: 'Arquivo não encontrado' });
    const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8' };
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return json(res, 204, {});
  if (req.url === '/api/health') return json(res, 200, { online: true });
  if (req.method === 'GET' && req.url === '/api/lobbies') return json(res, 200, { lobbies: listLobbies() });
  if (req.method === 'GET' && req.url === '/api/lobbies/events') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'Access-Control-Allow-Origin': '*' });
    res.write(`data: ${JSON.stringify({ type: 'lobbies', lobbies: listLobbies() })}\n\n`);
    eventClients.add(res);
    req.on('close', () => eventClients.delete(res));
    return;
  }
  if (req.method === 'POST' && req.url === '/api/lobbies') {
    try {
      const body = await readBody(req);
      const maxPlayers = Math.max(2, Math.min(20, Number(body.maxPlayers) || 10));
      const visibility = body.visibility === 'private' ? 'private' : 'public';
      const password = String(body.password || '').trim();
      if (visibility === 'private' && !password) return json(res, 400, { error: 'Lobby privado precisa de senha' });
      const lobby = { code: makeCode(), name: String(body.name || 'Partida amistosa').trim().slice(0, 28) || 'Partida amistosa', visibility, password, players: [], ownerId: null, started: false, maxPlayers, createdAt: Date.now() };
      lobbyStore.set(lobby.code, lobby); notifyLobbies(); return json(res, 201, { lobby: publicLobby(lobby) });
    } catch (error) { return json(res, 400, { error: error.message }); }
  }
  const roomMatch = req.url.match(/^\/api\/lobbies\/([A-Z0-9]+)$/);
  if (req.method === 'GET' && roomMatch) {
    const lobby = lobbyStore.get(roomMatch[1]);
    return lobby ? json(res, 200, { lobby: publicLobby(lobby) }) : json(res, 404, { error: 'Lobby não encontrado' });
  }
  const playerMatch = req.url.match(/^\/api\/lobbies\/([A-Z0-9]+)\/players$/);
  if (req.method === 'POST' && playerMatch) {
    try {
      const lobby = lobbyStore.get(playerMatch[1]); if (!lobby) return json(res, 404, { error: 'Lobby não encontrado' });
      const body = await readBody(req); const playerId = String(body.playerId || crypto.randomUUID());
      if (lobby.visibility === 'private' && String(body.password || '') !== lobby.password) return json(res, 403, { error: 'Senha incorreta' });
      const existing = lobby.players.find(player => player.playerId === playerId);
      const team = String(body.team || existing?.team || '').trim();
      if (team && lobby.players.some(player => player.playerId !== playerId && player.team === team)) return json(res, 409, { error: 'Esse clube já foi escolhido por outro jogador.' });
      if (existing) { existing.name = String(body.name || existing.name || 'Jogador').trim().slice(0, 20) || 'Jogador'; existing.team = team; notifyLobbies(); return json(res, 200, { playerId, lobby: publicLobby(lobby) }); }
      if (lobby.players.length >= lobby.maxPlayers) return json(res, 409, { error: 'Lobby cheio' });
      if (lobby.players.length === 0 || body.owner === true) { if (lobby.ownerId) return json(res, 403, { error: 'O lobby já possui dono' }); lobby.ownerId = playerId; }
      lobby.players.push({ playerId, name: String(body.name || 'Jogador').trim().slice(0, 20) || 'Jogador', team, ready: false, owner: lobby.ownerId === playerId });
      notifyLobbies(); return json(res, 201, { playerId, lobby: publicLobby(lobby) });
    } catch (error) { return json(res, 400, { error: error.message }); }
  }
  const readyMatch = req.url.match(/^\/api\/lobbies\/([A-Z0-9]+)\/players\/([^/]+)\/ready$/);
  if (req.method === 'POST' && readyMatch) {
    const lobby = lobbyStore.get(readyMatch[1]); const player = lobby?.players.find(item => item.playerId === readyMatch[2]);
    if (!lobby || !player) return json(res, 404, { error: 'Jogador não encontrado' });
    player.ready = true; notifyLobbies(); return json(res, 200, { lobby: publicLobby(lobby) });
  }
  const startMatch = req.url.match(/^\/api\/lobbies\/([A-Z0-9]+)\/start$/);
  if (req.method === 'POST' && startMatch) {
    const lobby = lobbyStore.get(startMatch[1]); if (!lobby) return json(res, 404, { error: 'Lobby não encontrado' });
    const body = await readBody(req); if (body.playerId !== lobby.ownerId) return json(res, 403, { error: 'Somente o dono pode iniciar' });
    if (!lobby.players.length || lobby.players.some(player => !player.ready)) return json(res, 409, { error: 'Todos os jogadores precisam estar prontos' });
    lobby.started = true; notifyLobbies(); return json(res, 200, { lobby: publicLobby(lobby), careerStarted: true });
  }
  const joinMatch = req.url.match(/^\/api\/lobbies\/([A-Z0-9]+)\/join$/);
  if (req.method === 'POST' && joinMatch) {
    try {
      const lobby = lobbyStore.get(joinMatch[1]);
      if (!lobby) return json(res, 404, { error: 'Lobby não encontrado' });
      const body = await readBody(req);
      if (lobby.visibility === 'private' && String(body.password || '') !== lobby.password) return json(res, 403, { error: 'Senha incorreta' });
      if ((Array.isArray(lobby.players) ? lobby.players.length : 0) >= lobby.maxPlayers) return json(res, 409, { error: 'Lobby cheio' });
      const team = String(body.team || '').trim(); if (team && lobby.players.some(player => player.team === team)) return json(res, 409, { error: 'Esse clube já foi escolhido por outro jogador.' });
      const playerId = String(body.playerId || crypto.randomUUID()); lobby.players.push({ playerId, name: String(body.name || 'Jogador'), team, ready: false, owner: false }); notifyLobbies(); return json(res, 200, { playerId, lobby: publicLobby(lobby) });
    } catch (error) { return json(res, 400, { error: error.message }); }
  }
  serveStatic(req, res);
});

server.listen(PORT, () => console.log(`SimuladorFut online em http://localhost:${PORT}`));
