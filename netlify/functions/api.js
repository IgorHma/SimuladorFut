const crypto = require('crypto');

const lobbies = globalThis.__simuladorFutLobbies || (globalThis.__simuladorFutLobbies = new Map());
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const response = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
  },
  body: JSON.stringify(body)
});

function makeCode() {
  let code;
  do code = Array.from({ length: 6 }, () => CODE_CHARS[crypto.randomInt(CODE_CHARS.length)]).join('');
  while (lobbies.has(code));
  return code;
}

function publicLobby(lobby) {
  const players = lobby.players || [];
  return {
    code: lobby.code,
    name: lobby.name,
    visibility: lobby.visibility,
    players: players.length,
    maxPlayers: lobby.maxPlayers,
    createdAt: lobby.createdAt,
    ownerId: lobby.ownerId,
    started: Boolean(lobby.started),
    ready: players.filter(player => player.ready).length,
    playerList: players.map(({ playerId, name, team, ready, owner }) => ({ playerId, name, team, ready, owner }))
  };
}

function getLobby(code) { return lobbies.get(code); }
function bodyOf(event) { try { return event.body ? JSON.parse(event.body) : {}; } catch { return null; } }

exports.handler = async event => {
  if (event.httpMethod === 'OPTIONS') return response(204, {});
  const path = (event.path || '').replace(/^\/.netlify\/functions\/api/, '').replace(/^\/api/, '') || '/';
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
  const method = event.httpMethod;

  if (method === 'GET' && parts[0] === 'health') return response(200, { online: true });
  if (method === 'GET' && parts[0] === 'lobbies' && parts.length === 1) {
    return response(200, { lobbies: [...lobbies.values()].map(publicLobby) });
  }
  if (method === 'POST' && parts[0] === 'lobbies' && parts.length === 1) {
    const body = bodyOf(event); if (!body) return response(400, { error: 'JSON inválido' });
    const visibility = body.visibility === 'private' ? 'private' : 'public';
    const password = String(body.password || '').trim();
    if (visibility === 'private' && !password) return response(400, { error: 'Lobby privado precisa de senha' });
    const lobby = { code: makeCode(), name: String(body.name || 'Partida amistosa').trim().slice(0, 28) || 'Partida amistosa', visibility, password, players: [], ownerId: null, started: false, maxPlayers: Math.max(2, Math.min(20, Number(body.maxPlayers) || 10)), createdAt: Date.now() };
    lobbies.set(lobby.code, lobby);
    return response(201, { lobby: publicLobby(lobby) });
  }

  const lobby = parts[0] === 'lobbies' ? getLobby(parts[1]) : null;
  if (!lobby) return response(404, { error: 'Lobby não encontrado' });
  if (method === 'GET' && parts.length === 2) return response(200, { lobby: publicLobby(lobby) });

  if (method === 'POST' && parts[2] === 'players' && parts.length === 3) {
    const body = bodyOf(event); if (!body) return response(400, { error: 'JSON inválido' });
    if (lobby.visibility === 'private' && String(body.password || '') !== lobby.password) return response(403, { error: 'Senha incorreta' });
    const playerId = String(body.playerId || crypto.randomUUID());
    const existing = lobby.players.find(player => player.playerId === playerId);
    const team = String(body.team || existing?.team || '').trim();
    if (team && lobby.players.some(player => player.playerId !== playerId && player.team === team)) return response(409, { error: 'Esse clube já foi escolhido por outro jogador.' });
    if (existing) {
      existing.name = String(body.name || existing.name || 'Jogador').trim().slice(0, 20) || 'Jogador';
      existing.team = team;
      return response(200, { playerId, lobby: publicLobby(lobby) });
    }
    if (lobby.players.length >= lobby.maxPlayers) return response(409, { error: 'Lobby cheio' });
    if (lobby.players.length === 0 || body.owner === true) {
      if (lobby.ownerId) return response(403, { error: 'O lobby já possui dono' });
      lobby.ownerId = playerId;
    }
    lobby.players.push({ playerId, name: String(body.name || 'Jogador').trim().slice(0, 20) || 'Jogador', team, ready: false, owner: lobby.ownerId === playerId });
    return response(201, { playerId, lobby: publicLobby(lobby) });
  }

  if (method === 'POST' && parts[2] === 'players' && parts[4] === 'ready') {
    const player = lobby.players.find(item => item.playerId === parts[3]);
    if (!player) return response(404, { error: 'Jogador não encontrado' });
    player.ready = true;
    return response(200, { lobby: publicLobby(lobby) });
  }

  if (method === 'POST' && parts[2] === 'start') {
    const body = bodyOf(event); if (!body || body.playerId !== lobby.ownerId) return response(403, { error: 'Somente o dono pode iniciar' });
    if (!lobby.players.length || lobby.players.some(player => !player.ready)) return response(409, { error: 'Todos os jogadores precisam estar prontos' });
    lobby.started = true;
    return response(200, { lobby: publicLobby(lobby), careerStarted: true });
  }
  return response(404, { error: 'Rota não encontrada' });
};
