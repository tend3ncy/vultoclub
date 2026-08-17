const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Função para processar multipart/form-data (upload)
function parseMultipart(req, boundary) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      try {
        const buffer = Buffer.concat(chunks);
        const parts = [];
        const boundaryBuffer = Buffer.from(`--${boundary}`);
        
        let start = 0;
        while (true) {
          const boundaryIndex = buffer.indexOf(boundaryBuffer, start);
          if (boundaryIndex === -1) break;
          
          const nextBoundary = buffer.indexOf(boundaryBuffer, boundaryIndex + boundaryBuffer.length);
          if (nextBoundary === -1) break;
          
          const partData = buffer.slice(boundaryIndex + boundaryBuffer.length, nextBoundary);
          const headerEnd = partData.indexOf('\r\n\r\n');
          
          if (headerEnd !== -1) {
            const headers = partData.slice(0, headerEnd).toString();
            const content = partData.slice(headerEnd + 4, partData.length - 2);
            
            const nameMatch = headers.match(/name="([^"]+)"/);
            const filenameMatch = headers.match(/filename="([^"]+)"/);
            const contentTypeMatch = headers.match(/Content-Type: (.+)/);
            
            if (nameMatch) {
              parts.push({
                name: nameMatch[1],
                filename: filenameMatch ? filenameMatch[1] : null,
                contentType: contentTypeMatch ? contentTypeMatch[1].trim() : null,
                data: content
              });
            }
          }
          
          start = nextBoundary;
        }
        
        resolve(parts);
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

// ── CONFIG ────────────────────────────────────────────────────────────────────
const PORT = 3000;
const SENHA = process.env.VULTO_SENHA || 'vulto2024';
const SENHA_HASH = crypto.createHash('sha256').update(SENHA).digest('hex');

// Portfolio credentials
const PORTFOLIO_USER = process.env.PORTFOLIO_USER || 'freshzito';
const PORTFOLIO_PASS = process.env.PORTFOLIO_PASS || 'fresh2024';
const PORTFOLIO_PASS_HASH = crypto.createHash('sha256').update(PORTFOLIO_PASS).digest('hex');

const DB_FILE = path.join(__dirname, 'db.json');

// Sessões ativas
const sessions = new Map();
const portfolioSessions = new Map();
const SESSION_TTL = 4 * 60 * 60 * 1000;
const failMap = new Map();
const MAX_FAILS = 5;
const LOCK_MS = 5 * 60 * 1000;

// ── DB (arquivo JSON) ─────────────────────────────────────────────────────────
function readDB() {
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
  catch { 
    return { 
      products: [], 
      links: { bio: '', links: [] }, 
      settings: { heroVideo: '' }, 
      eventos: { passados: [], proximos: [] },
      portfolio: {
        projects: [],
        config: {
          name: 'Freshzito',
          title: 'Creative Director & Visual Artist',
          subtitle: 'Especializado em design, fotografia e direção de arte',
          bio: 'Designer, ilustrador e fotógrafo com foco em criar experiências visuais autênticas e impactantes.',
          stats: { years: '5+', projects: '50+', followers: '2.2k' },
          contact: { instagram: 'https://instagram.com/freshzito__', email: 'contato@freshzito.com', whatsapp: '' }
        }
      }
    }; 
  }
}
function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ── MIME TYPES ────────────────────────────────────────────────────────────────
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.webp': 'image/webp',
  '.mp4':  'video/mp4',
  '.glb':  'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.json': 'application/json',
};

// ── HELPERS ───────────────────────────────────────────────────────────────────
function parseCookies(req) {
  const raw = req.headers.cookie || '';
  return Object.fromEntries(raw.split(';').map(c => c.trim().split('=').map(decodeURIComponent)));
}

function parseBody(req) {
  return new Promise(resolve => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { resolve({}); }
    });
  });
}

function genToken() {
  return crypto.randomBytes(32).toString('hex');
}

function isAuthenticated(req) {
  const cookies = parseCookies(req);
  const token = cookies['vulto_session'];
  if (!token) return false;
  const sess = sessions.get(token);
  if (!sess) return false;
  if (Date.now() > sess.expires) { sessions.delete(token); return false; }
  return true;
}

function isPortfolioAuthenticated(req) {
  const cookies = parseCookies(req);
  const token = cookies['portfolio_session'];
  if (!token) return false;
  const sess = portfolioSessions.get(token);
  if (!sess) return false;
  if (Date.now() > sess.expires) { portfolioSessions.delete(token); return false; }
  return true;
}

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      // Serve 404.html custom
      const page404 = path.join(__dirname, '404.html');
      fs.readFile(page404, (err404, data404) => {
        if (err404) { res.writeHead(404); res.end('Not found'); return; }
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(data404);
      });
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

// ── SERVER ────────────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // ── API: LOGIN ──────────────────────────────────────────────────────────────
  if (pathname === '/api/login' && req.method === 'POST') {
    const ip = req.socket.remoteAddress;
    const failData = failMap.get(ip) || { count: 0, lockUntil: 0 };

    if (Date.now() < failData.lockUntil) {
      const left = Math.ceil((failData.lockUntil - Date.now()) / 1000);
      return json(res, 429, { error: `Bloqueado. Aguarde ${left}s.` });
    }

    const body = await parseBody(req);
    const inputHash = crypto.createHash('sha256').update(body.senha || '').digest('hex');

    if (inputHash === SENHA_HASH) {
      failMap.delete(ip);
      const token = genToken();
      sessions.set(token, { expires: Date.now() + SESSION_TTL });
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Set-Cookie': `vulto_session=${token}; HttpOnly; Path=/; Max-Age=${SESSION_TTL / 1000}`,
      });
      return res.end(JSON.stringify({ ok: true }));
    } else {
      failData.count++;
      if (failData.count >= MAX_FAILS) {
        failData.lockUntil = Date.now() + LOCK_MS;
        failData.count = 0;
      }
      failMap.set(ip, failData);
      const left = MAX_FAILS - failData.count;
      return json(res, 401, { error: `Senha incorreta. ${left} tentativa(s) restante(s).` });
    }
  }

  // ── API: LOGOUT ─────────────────────────────────────────────────────────────
  if (pathname === '/api/logout' && req.method === 'POST') {
    const cookies = parseCookies(req);
    if (cookies['vulto_session']) sessions.delete(cookies['vulto_session']);
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Set-Cookie': 'vulto_session=; HttpOnly; Path=/; Max-Age=0',
    });
    return res.end(JSON.stringify({ ok: true }));
  }

  // ── API: CHECK AUTH ─────────────────────────────────────────────────────────
  if (pathname === '/api/auth' && req.method === 'GET') {
    return json(res, 200, { authenticated: isAuthenticated(req) });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PORTFOLIO API
  // ══════════════════════════════════════════════════════════════════════════

  // ── API: PORTFOLIO LOGIN ────────────────────────────────────────────────────
  if (pathname === '/api/portfolio/login' && req.method === 'POST') {
    const body = await parseBody(req);
    const passHash = crypto.createHash('sha256').update(body.password || '').digest('hex');

    if (body.username === PORTFOLIO_USER && passHash === PORTFOLIO_PASS_HASH) {
      const token = genToken();
      portfolioSessions.set(token, { expires: Date.now() + SESSION_TTL });
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Set-Cookie': `portfolio_session=${token}; HttpOnly; Path=/; Max-Age=${SESSION_TTL / 1000}`,
      });
      return res.end(JSON.stringify({ ok: true }));
    } else {
      return json(res, 401, { error: 'Usuário ou senha incorretos' });
    }
  }

  // ── API: PORTFOLIO LOGOUT ───────────────────────────────────────────────────
  if (pathname === '/api/portfolio/logout' && req.method === 'POST') {
    const cookies = parseCookies(req);
    if (cookies['portfolio_session']) portfolioSessions.delete(cookies['portfolio_session']);
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Set-Cookie': 'portfolio_session=; HttpOnly; Path=/; Max-Age=0',
    });
    return res.end(JSON.stringify({ ok: true }));
  }

  // ── API: PORTFOLIO AUTH CHECK ───────────────────────────────────────────────
  if (pathname === '/api/portfolio/auth' && req.method === 'GET') {
    return json(res, 200, { authenticated: isPortfolioAuthenticated(req) });
  }

  // ── API: PORTFOLIO PROJECTS (público - GET) ─────────────────────────────────
  if (pathname === '/api/portfolio/projects' && req.method === 'GET') {
    const db = readDB();
    return json(res, 200, db.portfolio?.projects || []);
  }

  // ── API: PORTFOLIO PROJECTS (admin - POST) ──────────────────────────────────
  if (pathname === '/api/portfolio/projects' && req.method === 'POST') {
    if (!isPortfolioAuthenticated(req)) return json(res, 401, { error: 'Não autorizado' });
    const body = await parseBody(req);
    const db = readDB();
    if (!db.portfolio) db.portfolio = { projects: [], config: {} };
    body.id = Date.now().toString();
    db.portfolio.projects.push(body);
    writeDB(db);
    return json(res, 201, body);
  }

  // ── API: PORTFOLIO PROJECTS (admin - PUT) ───────────────────────────────────
  if (pathname.startsWith('/api/portfolio/projects/') && req.method === 'PUT') {
    if (!isPortfolioAuthenticated(req)) return json(res, 401, { error: 'Não autorizado' });
    const id = pathname.split('/')[4];
    const body = await parseBody(req);
    const db = readDB();
    if (!db.portfolio) db.portfolio = { projects: [], config: {} };
    const idx = db.portfolio.projects.findIndex(p => p.id === id);
    if (idx === -1) return json(res, 404, { error: 'Não encontrado' });
    db.portfolio.projects[idx] = { ...db.portfolio.projects[idx], ...body, id };
    writeDB(db);
    return json(res, 200, db.portfolio.projects[idx]);
  }

  // ── API: PORTFOLIO PROJECTS (admin - DELETE) ────────────────────────────────
  if (pathname.startsWith('/api/portfolio/projects/') && req.method === 'DELETE') {
    if (!isPortfolioAuthenticated(req)) return json(res, 401, { error: 'Não autorizado' });
    const id = pathname.split('/')[4];
    const db = readDB();
    if (!db.portfolio) db.portfolio = { projects: [], config: {} };
    db.portfolio.projects = db.portfolio.projects.filter(p => p.id !== id);
    writeDB(db);
    return json(res, 200, { ok: true });
  }

  // ── API: PORTFOLIO CONFIG (público - GET) ───────────────────────────────────
  if (pathname === '/api/portfolio/config' && req.method === 'GET') {
    const db = readDB();
    return json(res, 200, db.portfolio?.config || {});
  }

  // ── API: PORTFOLIO CONFIG (admin - PUT) ─────────────────────────────────────
  if (pathname === '/api/portfolio/config' && req.method === 'PUT') {
    if (!isPortfolioAuthenticated(req)) return json(res, 401, { error: 'Não autorizado' });
    const body = await parseBody(req);
    const db = readDB();
    if (!db.portfolio) db.portfolio = { projects: [], config: {} };
    
    // Se tem nova senha, atualizar
    if (body.newPassword) {
      // Aqui você pode adicionar lógica para atualizar a senha
      // Por enquanto, apenas remove do objeto de config
      delete body.newPassword;
    }
    
    db.portfolio.config = { ...db.portfolio.config, ...body };
    writeDB(db);
    return json(res, 200, db.portfolio.config);
  }

  // ── API: PORTFOLIO UPLOAD (admin - POST) ────────────────────────────────────
  if (pathname === '/api/portfolio/upload' && req.method === 'POST') {
    if (!isPortfolioAuthenticated(req)) return json(res, 401, { error: 'Não autorizado' });
    
    try {
      const contentType = req.headers['content-type'] || '';
      const boundaryMatch = contentType.match(/boundary=(.+)/);
      
      if (!boundaryMatch) {
        return json(res, 400, { error: 'Invalid content type' });
      }
      
      const boundary = boundaryMatch[1];
      const parts = await parseMultipart(req, boundary);
      const imagePart = parts.find(p => p.name === 'image');
      
      if (!imagePart || !imagePart.filename) {
        return json(res, 400, { error: 'No image provided' });
      }
      
      // Gerar nome único
      const ext = path.extname(imagePart.filename);
      const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
      const uploadDir = path.join(__dirname, 'uploads', 'portfolio');
      const filepath = path.join(uploadDir, filename);
      
      // Criar diretório se não existir
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      // Salvar arquivo
      fs.writeFileSync(filepath, imagePart.data);
      
      // Retornar URL
      const url = `/uploads/portfolio/${filename}`;
      return json(res, 200, { url, filename });
      
    } catch (error) {
      console.error('Upload error:', error);
      return json(res, 500, { error: 'Upload failed' });
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // VOTAÇÃO API
  // ══════════════════════════════════════════════════════════════════════════

  // GET — público: retorna contagem de votos
  if (pathname === '/api/votacao' && req.method === 'GET') {
    const db = readDB();
    return json(res, 200, db.votacao || { modelo1: 0, modelo2: 0 });
  }

  // GET — público: retorna config da votação (ativa, nomes, imagem)
  if (pathname === '/api/votacao/config' && req.method === 'GET') {
    const db = readDB();
    const cfg = db.votacaoConfig || { active: true, name1: 'MODELO 1', name2: 'MODELO 2', image: '/arquivos/escolha.png' };
    return json(res, 200, cfg);
  }

  // PUT — admin: atualiza config da votação
  if (pathname === '/api/votacao/config' && req.method === 'PUT') {
    if (!isAuthenticated(req)) return json(res, 401, { error: 'Não autorizado' });
    const body = await parseBody(req);
    const db = readDB();
    if (!db.votacaoConfig) db.votacaoConfig = { active: true, name1: 'MODELO 1', name2: 'MODELO 2', image: '/arquivos/escolha.png' };

    if (typeof body.active !== 'undefined') db.votacaoConfig.active = body.active;
    if (typeof body.name1 !== 'undefined') db.votacaoConfig.name1 = body.name1;
    if (typeof body.name2 !== 'undefined') db.votacaoConfig.name2 = body.name2;
    if (typeof body.image !== 'undefined') {
      // Se é base64, salva como arquivo
      if (body.image && body.image.startsWith('data:image')) {
        const uploadsDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
        const ext = body.image.includes('png') ? '.png' : '.jpg';
        const filename = 'votacao-' + Date.now() + ext;
        const base64Data = body.image.split(',')[1];
        fs.writeFileSync(path.join(uploadsDir, filename), Buffer.from(base64Data, 'base64'));
        db.votacaoConfig.image = '/uploads/' + filename;
      } else {
        db.votacaoConfig.image = body.image;
      }
    }

    writeDB(db);
    return json(res, 200, db.votacaoConfig);
  }

  // POST — público: registra voto (1 por IP)
  if (pathname === '/api/votacao' && req.method === 'POST') {
    const body = await parseBody(req);
    const modelo = parseInt(body.modelo);
    if (modelo !== 1 && modelo !== 2) return json(res, 400, { error: 'Modelo inválido' });

    const ip = req.socket.remoteAddress;
    const ua = req.headers['user-agent'] || '';
    const visitorId = crypto.createHash('md5').update(ip + ua).digest('hex');
    const db = readDB();
    if (!db.votacao) db.votacao = { modelo1: 0, modelo2: 0, votos: {} };
    if (!db.votacao.votos) db.votacao.votos = {};

    // Verifica se já votou
    if (db.votacao.votos[visitorId]) {
      return json(res, 409, { error: 'Você já votou!', votou: db.votacao.votos[visitorId] });
    }

    db.votacao['modelo' + modelo]++;
    db.votacao.votos[visitorId] = modelo;
    writeDB(db);
    return json(res, 200, { success: true, modelo1: db.votacao.modelo1, modelo2: db.votacao.modelo2 });
  }

  // POST — admin: reseta votação
  if (pathname === '/api/votacao/reset' && req.method === 'POST') {
    if (!isAuthenticated(req)) return json(res, 401, { error: 'Não autorizado' });
    const db = readDB();
    db.votacao = { modelo1: 0, modelo2: 0, votos: {} };
    writeDB(db);
    return json(res, 200, { success: true });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ESTOQUE / DROPS API
  // ══════════════════════════════════════════════════════════════════════════

  // GET — público: retorna estoque atual dos produtos
  if (pathname === '/api/estoque' && req.method === 'GET') {
    const db = readDB();
    return json(res, 200, db.estoque || {});
  }

  // PUT — admin: atualiza quantidade de um produto
  if (pathname === '/api/estoque' && req.method === 'PUT') {
    if (!isAuthenticated(req)) return json(res, 401, { error: 'Não autorizado' });
    const body = await parseBody(req);
    if (!body || !body.id) return json(res, 400, { error: 'ID do produto obrigatório' });
    const db = readDB();
    if (!db.estoque) db.estoque = {};
    db.estoque[body.id] = {
      quantidade: parseInt(body.quantidade) || 0,
      tipo: body.tipo || 'normal', // 'normal' ou '1:1'
      label: body.label || '',
      updatedAt: new Date().toISOString()
    };
    writeDB(db);
    return json(res, 200, { success: true, estoque: db.estoque[body.id] });
  }

  // POST /api/estoque/compra — decrementa 1 unidade (quando cliente finaliza pedido)
  if (pathname === '/api/estoque/compra' && req.method === 'POST') {
    const body = await parseBody(req);
    if (!body || !body.id) return json(res, 400, { error: 'ID obrigatório' });
    const db = readDB();
    if (!db.estoque || !db.estoque[body.id]) return json(res, 404, { error: 'Produto não encontrado' });
    const item = db.estoque[body.id];
    if (item.quantidade <= 0) return json(res, 409, { error: 'Sem estoque' });
    item.quantidade -= 1;
    item.updatedAt = new Date().toISOString();
    writeDB(db);
    return json(res, 200, { success: true, restante: item.quantidade });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // VOUCHERS API (local dev)
  // ══════════════════════════════════════════════════════════════════════════

  if (pathname === '/api/vouchers.php' || pathname === '/api/vouchers') {
    const vouchersFile = path.join(__dirname, 'data', 'vouchers.json');
    const eventoConfigFile = path.join(__dirname, 'data', 'evento-config.json');

    function getEventoConfig() {
      try { return JSON.parse(fs.readFileSync(eventoConfigFile, 'utf8')); } catch { return {maxExposicao:100,maxBatalha:16}; }
    }
    const evConfig = getEventoConfig();
    const MAX_EXPO = evConfig.maxExposicao;
    const MAX_BATALHA = evConfig.maxBatalha;

    function loadVouchers() {
      try { return JSON.parse(fs.readFileSync(vouchersFile, 'utf8')); } catch { return []; }
    }
    function saveVouchers(data) { fs.writeFileSync(vouchersFile, JSON.stringify(data, null, 2)); }

    const action = url.searchParams.get('action') || '';

    if (req.method === 'GET' && action === 'vagas') {
      const v = loadVouchers();
      const expo = v.filter(x => x.tipo === 'exposicao').length;
      const bat = v.filter(x => x.tipo === 'batalha').length;
      return json(res, 200, { exposicao: {total:MAX_EXPO, usadas:expo, disponiveis:MAX_EXPO-expo}, batalha: {total:MAX_BATALHA, usadas:bat, disponiveis:MAX_BATALHA-bat} });
    }

    if (req.method === 'GET' && action === 'consultar') {
      const codigo = (url.searchParams.get('codigo') || '').toUpperCase();
      const v = loadVouchers();
      const found = v.find(x => x.codigo === codigo);
      if (!found) return json(res, 404, {error:'Voucher não encontrado'});
      return json(res, 200, found);
    }

    if (req.method === 'GET' && !action) {
      if (!isAuthenticated(req)) return json(res, 401, {error:'Não autorizado'});
      return json(res, 200, loadVouchers());
    }

    if (req.method === 'POST' && !action) {
      const body = await parseBody(req);
      if (!body.nome || !body.tipo) return json(res, 400, {error:'Nome e tipo obrigatórios'});
      const tipo = body.tipo;
      if (!['exposicao','batalha'].includes(tipo)) return json(res, 400, {error:'Tipo inválido'});
      const v = loadVouchers();
      const count = v.filter(x => x.tipo === tipo).length;
      const max = tipo === 'batalha' ? MAX_BATALHA : MAX_EXPO;
      if (count >= max) return json(res, 409, {error:'Vagas esgotadas'});

      // Verifica placa duplicada
      const placa = (body.placa||'').toUpperCase();
      if (placa && v.find(x => x.placa === placa)) {
        return json(res, 409, {error:'Essa placa já está cadastrada!'});
      }
      const prefix = tipo === 'batalha' ? 'BTL' : 'EXP';
      const voucher = {
        id: 'vch_' + Date.now().toString(36),
        codigo: prefix + '-' + crypto.randomBytes(3).toString('hex').toUpperCase(),
        tipo, nome: body.nome, carro: body.carro||'', placa: (body.placa||'').toUpperCase(),
        instagram: body.instagram||'', telefone: body.telefone||'',
        checkin: false, criadoEm: new Date().toISOString()
      };
      v.push(voucher);
      saveVouchers(v);
      return json(res, 200, {success:true, voucher});
    }

    if (req.method === 'PUT' && action === 'checkin') {
      if (!isAuthenticated(req)) return json(res, 401, {error:'Não autorizado'});
      const body = await parseBody(req);
      const codigo = (body.codigo||'').toUpperCase();
      const v = loadVouchers();
      const found = v.find(x => x.codigo === codigo);
      if (!found) return json(res, 404, {error:'Não encontrado'});
      if (found.checkin) return json(res, 200, {error:'Já utilizado', voucher:found});
      found.checkin = true;
      found.checkinEm = new Date().toISOString();
      saveVouchers(v);
      return json(res, 200, {success:true, voucher:found});
    }

    if (req.method === 'DELETE') {
      if (!isAuthenticated(req)) return json(res, 401, {error:'Não autorizado'});
      const body = await parseBody(req);
      const id = body.id;
      if (!id) return json(res, 400, {error:'ID obrigatório'});
      let v = loadVouchers();
      v = v.filter(x => x.id !== id);
      saveVouchers(v);
      return json(res, 200, {success:true});
    }

    if (req.method === 'GET' && action === 'config') {
      return json(res, 200, getEventoConfig());
    }

    if (req.method === 'PUT' && action === 'config') {
      if (!isAuthenticated(req)) return json(res, 401, {error:'Não autorizado'});
      const body = await parseBody(req);
      const cfg = getEventoConfig();
      if (body.maxExposicao !== undefined) cfg.maxExposicao = parseInt(body.maxExposicao);
      if (body.maxBatalha !== undefined) cfg.maxBatalha = parseInt(body.maxBatalha);
      fs.writeFileSync(eventoConfigFile, JSON.stringify(cfg));
      return json(res, 200, {success:true, config:cfg});
    }

    return json(res, 405, {error:'Método não permitido'});
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PARCERIAS API
  // ══════════════════════════════════════════════════════════════════════════

  if (pathname === '/api/parcerias' && req.method === 'GET') {
    const db = readDB();
    return json(res, 200, db.parcerias || []);
  }

  if (pathname === '/api/parcerias' && req.method === 'POST') {
    if (!isAuthenticated(req)) return json(res, 401, { error: 'Não autorizado' });
    const body = await parseBody(req);
    if (!body || !body.nome) return json(res, 400, { error: 'Nome obrigatório' });
    const db = readDB();
    if (!db.parcerias) db.parcerias = [];
    const parceiro = {
      id: 'parc_' + Date.now().toString(36),
      nome: body.nome, logo: body.logo || '', instagram: body.instagram || '',
      contato: body.contato || '', desconto: parseInt(body.desconto) || 10,
      cupom: (body.cupom || '').toUpperCase(), ativo: true, criadoEm: new Date().toISOString()
    };
    db.parcerias.push(parceiro);
    writeDB(db);
    return json(res, 201, { success: true, parceiro });
  }

  if (pathname === '/api/parcerias' && req.method === 'PUT') {
    if (!isAuthenticated(req)) return json(res, 401, { error: 'Não autorizado' });
    const body = await parseBody(req);
    if (!body || !body.id) return json(res, 400, { error: 'ID obrigatório' });
    const db = readDB();
    if (!db.parcerias) db.parcerias = [];
    const p = db.parcerias.find(x => x.id === body.id);
    if (!p) return json(res, 404, { error: 'Não encontrado' });
    if (typeof body.nome !== 'undefined') p.nome = body.nome;
    if (typeof body.instagram !== 'undefined') p.instagram = body.instagram;
    if (typeof body.contato !== 'undefined') p.contato = body.contato;
    if (typeof body.desconto !== 'undefined') p.desconto = parseInt(body.desconto);
    if (typeof body.cupom !== 'undefined') p.cupom = body.cupom.toUpperCase();
    if (typeof body.ativo !== 'undefined') p.ativo = body.ativo;
    if (typeof body.logo !== 'undefined') p.logo = body.logo;
    writeDB(db);
    return json(res, 200, { success: true });
  }

  if (pathname === '/api/parcerias' && req.method === 'DELETE') {
    if (!isAuthenticated(req)) return json(res, 401, { error: 'Não autorizado' });
    const body = await parseBody(req);
    if (!body || !body.id) return json(res, 400, { error: 'ID obrigatório' });
    const db = readDB();
    if (!db.parcerias) db.parcerias = [];
    db.parcerias = db.parcerias.filter(x => x.id !== body.id);
    writeDB(db);
    return json(res, 200, { success: true });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MOCKUP ORDERS API
  // ══════════════════════════════════════════════════════════════════════════

  // ── API: MOCKUP ORDERS (público - POST) ─────────────────────────────────────
  if (pathname === '/api/mockup-orders' && req.method === 'POST') {
    const body = await parseBody(req);
    if (!body || !body.id) return json(res, 400, { error: 'Dados inválidos' });

    const db = readDB();
    if (!db.mockupOrders) db.mockupOrders = [];

    // Save screenshot separately
    if (body.screenshot && body.screenshot.startsWith('data:image')) {
      const uploadsDir = path.join(__dirname, 'uploads', 'mockups');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

      const base64Data = body.screenshot.split(',')[1];
      const screenshotPath = `uploads/mockups/${body.id}.png`;
      fs.writeFileSync(path.join(__dirname, screenshotPath), Buffer.from(base64Data, 'base64'));
      body.screenshotFile = screenshotPath;
      delete body.screenshot;
    }

    db.mockupOrders.push(body);
    writeDB(db);
    return json(res, 201, { success: true, order: body });
  }

  // ── API: MOCKUP ORDERS (admin - GET) ────────────────────────────────────────
  if (pathname === '/api/mockup-orders' && req.method === 'GET') {
    if (!isAuthenticated(req)) return json(res, 401, { error: 'Não autorizado' });
    const db = readDB();
    const orders = db.mockupOrders || [];
    const status = url.searchParams.get('status');
    const filtered = status && status !== 'all' ? orders.filter(o => o.status === status) : orders;
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    return json(res, 200, { success: true, orders: filtered, total: filtered.length });
  }

  // ── API: MOCKUP ORDERS (admin - PUT) ────────────────────────────────────────
  if (pathname === '/api/mockup-orders' && req.method === 'PUT') {
    if (!isAuthenticated(req)) return json(res, 401, { error: 'Não autorizado' });
    const body = await parseBody(req);
    if (!body || !body.id || !body.status) return json(res, 400, { error: 'ID e status obrigatórios' });

    const db = readDB();
    if (!db.mockupOrders) db.mockupOrders = [];
    const order = db.mockupOrders.find(o => o.id === body.id);
    if (!order) return json(res, 404, { error: 'Pedido não encontrado' });

    order.status = body.status;
    order.updatedAt = new Date().toISOString();
    writeDB(db);
    return json(res, 200, { success: true, message: 'Status atualizado' });
  }

  // ── API: EVENTOS (público - GET) ────────────────────────────────────────────
  if (pathname === '/api/eventos' && req.method === 'GET') {
    const db = readDB();
    return json(res, 200, db.eventos || { passados: [], proximos: [] });
  }

  // ── API: EVENTOS (admin - PUT) ──────────────────────────────────────────────
  if (pathname === '/api/eventos' && req.method === 'PUT') {
    if (!isAuthenticated(req)) return json(res, 401, { error: 'Não autorizado' });
    const body = await parseBody(req);
    const db = readDB();
    db.eventos = body;
    writeDB(db);
    return json(res, 200, db.eventos);
  }

  // ── API: SETTINGS (público - GET) ───────────────────────────────────────────
  if (pathname === '/api/settings' && req.method === 'GET') {
    const db = readDB();
    return json(res, 200, db.settings || { heroVideo: '' });
  }

  // ── API: SETTINGS (admin - PUT) ─────────────────────────────────────────────
  if (pathname === '/api/settings' && req.method === 'PUT') {
    if (!isAuthenticated(req)) return json(res, 401, { error: 'Não autorizado' });
    const body = await parseBody(req);
    const db = readDB();
    db.settings = { ...db.settings, ...body };
    writeDB(db);
    return json(res, 200, db.settings);
  }

  // ── API: LINKS (público - GET) ──────────────────────────────────────────────
  if (pathname === '/api/links' && req.method === 'GET') {
    const db = readDB();
    return json(res, 200, db.links || { bio: '', links: [] });
  }

  // ── API: LINKS (admin - PUT) ────────────────────────────────────────────────
  if (pathname === '/api/links' && req.method === 'PUT') {
    if (!isAuthenticated(req)) return json(res, 401, { error: 'Não autorizado' });
    const body = await parseBody(req);
    const db = readDB();
    db.links = body;
    writeDB(db);
    return json(res, 200, db.links);
  }

  // ── API: PRODUTOS (público - GET) ──────────────────────────────────────────
  if (pathname === '/api/products' && req.method === 'GET') {
    return json(res, 200, readDB().products);
  }

  // ── API: PRODUTOS (admin - POST/PUT/DELETE) ─────────────────────────────────
  if (pathname === '/api/products' && req.method === 'POST') {
    if (!isAuthenticated(req)) return json(res, 401, { error: 'Não autorizado' });
    const body = await parseBody(req);
    const db = readDB();
    body.id = Date.now().toString();
    db.products.push(body);
    writeDB(db);
    return json(res, 201, body);
  }

  if (pathname.startsWith('/api/products/') && req.method === 'PUT') {
    if (!isAuthenticated(req)) return json(res, 401, { error: 'Não autorizado' });
    const id = pathname.split('/')[3];
    const body = await parseBody(req);
    const db = readDB();
    const idx = db.products.findIndex(p => p.id === id);
    if (idx === -1) return json(res, 404, { error: 'Não encontrado' });
    db.products[idx] = { ...db.products[idx], ...body };
    writeDB(db);
    return json(res, 200, db.products[idx]);
  }

  if (pathname.startsWith('/api/products/') && req.method === 'DELETE') {
    if (!isAuthenticated(req)) return json(res, 401, { error: 'Não autorizado' });
    const id = pathname.split('/')[3];
    const db = readDB();
    db.products = db.products.filter(p => p.id !== id);
    writeDB(db);
    return json(res, 200, { ok: true });
  }

  // ── PROTEGE /pages/admin/*.html ─────────────────────────────────────────────────────
  if (pathname.startsWith('/pages/admin/') || pathname.startsWith('/pages/gestao/')) {
    if (!isAuthenticated(req)) {
      res.writeHead(302, { Location: '/gestao/login' });
      return res.end();
    }
  }

  // ── PROTEGE /pages/mockup.html — só admin acessa ────────────────────────────
  if (pathname === '/pages/mockup.html' || pathname === '/pages/mockup') {
    if (!isAuthenticated(req)) {
      res.writeHead(302, { Location: '/gestao/login' });
      return res.end();
    }
  }

  // ── PROTEGE /pages/portfolio/admin*.html ────────────────────────────────────────────
  if (pathname.startsWith('/pages/portfolio/admin')) {
    if (!isPortfolioAuthenticated(req)) {
      res.writeHead(302, { Location: '/pages/portfolio/login.html' });
      return res.end();
    }
  }

  // ── Rota /login → pages/login.html ─────────────────────────────────────────────
  if (pathname === '/login') {
    res.writeHead(302, { Location: '/pages/login.html' });
    return res.end();
  }

  // ── Rotas /gestao (renomeado de /admin) ──────────────────────────────────────
  if (pathname === '/gestao' || pathname === '/gestao/') {
    res.writeHead(302, { Location: '/pages/admin/admin.html' });
    return res.end();
  }
  if (pathname === '/gestao/login') {
    res.writeHead(302, { Location: '/pages/login.html' });
    return res.end();
  }
  if (pathname === '/gestao/links') {
    res.writeHead(302, { Location: '/pages/admin/admin-links.html' });
    return res.end();
  }
  if (pathname === '/gestao/eventos') {
    res.writeHead(302, { Location: '/pages/admin/admin-eventos.html' });
    return res.end();
  }
  if (pathname === '/gestao/cupons') {
    res.writeHead(302, { Location: '/pages/admin/admin-cupons.html' });
    return res.end();
  }
  if (pathname === '/gestao/config') {
    res.writeHead(302, { Location: '/pages/admin/admin-config.html' });
    return res.end();
  }
  if (pathname === '/gestao/mockups') {
    res.writeHead(302, { Location: '/pages/admin/admin-mockups.html' });
    return res.end();
  }
  if (pathname === '/gestao/editor') {
    res.writeHead(302, { Location: '/pages/mockup.html' });
    return res.end();
  }
  if (pathname === '/gestao/ascii') {
    res.writeHead(302, { Location: '/pages/ascii-art.html' });
    return res.end();
  }
  if (pathname === '/gestao/parcerias') {
    res.writeHead(302, { Location: '/pages/admin/admin-parcerias.html' });
    return res.end();
  }
  if (pathname === '/gestao/pedidos') {
    res.writeHead(302, { Location: '/pages/admin/admin-pedidos.html' });
    return res.end();
  }
  if (pathname === '/gestao/checkin') {
    res.writeHead(302, { Location: '/pages/admin/checkin.html' });
    return res.end();
  }
  if (pathname === '/gestao/inscritos') {
    res.writeHead(302, { Location: '/pages/admin/admin-vouchers.html' });
    return res.end();
  }
  if (pathname === '/gestao/chaveamento') {
    res.writeHead(302, { Location: '/pages/admin/chaveamento.html' });
    return res.end();
  }
  if (pathname === '/gestao/estoque') {
    res.writeHead(302, { Location: '/pages/admin/admin-estoque.html' });
    return res.end();
  }

  // ── Rotas /admin antigas → redireciona 404 (não expõe mais) ─────────────────
  if (pathname === '/admin' || pathname === '/admin.html' ||
      pathname.startsWith('/admin/')) {
    res.writeHead(404); return res.end('Not found');
  }

  // ── ARQUIVOS ESTÁTICOS ──────────────────────────────────────────────────────
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);

  // Segurança: impede path traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403); return res.end('Forbidden');
  }

  serveFile(res, filePath);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  VULTO rodando em http://0.0.0.0:${PORT}`);
  console.log(`  Senha atual: ${SENHA}`);
  console.log(`  Para trocar: VULTO_SENHA=suasenha node server.js\n`);
});
