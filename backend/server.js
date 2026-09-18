import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { TikTokLiveConnection, SignConfig } from 'tiktok-live-connector';

const app = express();
const server = createServer(app);

app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────
const PORT = process.env.PORT || 3001;
const TIKTOK_USERNAME = (process.env.TIKTOK_USERNAME || 'ruang_hoki').trim().replace(/^@/, '');
const LIKE_THRESHOLD = parseInt(process.env.LIKE_THRESHOLD) || 50;
const MAX_QUEUE = parseInt(process.env.MAX_QUEUE) || 20;
const TIKTOK_SESSION_ID = (process.env.TIKTOK_SESSION_ID || '').trim();
const SIGN_API_KEY = (process.env.SIGN_API_KEY || '').trim();


// ─────────────────────────────────────────
// GAME STATE
// ─────────────────────────────────────────
const gameState = {
  queue: [],
  champion: null,
  challenger: null,
  likeCounters: {},
  inGame: new Set(),
};

// ─────────────────────────────────────────
// WEBSOCKET SERVER
// ─────────────────────────────────────────
const wss = new WebSocketServer({ server });
const clients = new Set();
let isConnected = false;

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`[WS] 💻 Frontend terhubung! Total client: ${clients.size}`);

  ws.send(JSON.stringify({ type: 'sync', payload: getPublicState() }));
  ws.send(JSON.stringify({ type: 'tiktok_status', payload: { connected: isConnected, username: TIKTOK_USERNAME } }));

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[WS] Client disconnected. Total: ${clients.size}`);
  });

  ws.on('error', (err) => {
    console.error('[WS] Error:', err.message);
  });
});

function broadcast(type, payload) {
  const msg = JSON.stringify({ type, payload });
  for (const ws of clients) {
    if (ws.readyState === 1) {
      ws.send(msg);
    }
  }
}

function getPublicState() {
  return {
    queue: gameState.queue.slice(0, MAX_QUEUE),
    champion: gameState.champion,
    challenger: gameState.challenger,
  };
}

// ─────────────────────────────────────────
// QUEUE & PLAYER LOGIC
// ─────────────────────────────────────────
function addToQueue(username, source, extraHp = 0) {
  if (!username) return;
  const cleanUser = String(username).replace(/^@/, '').trim();
  if (!cleanUser) return;

  if (gameState.inGame.has(cleanUser)) return;
  if (gameState.queue.find((u) => u.username === cleanUser)) return;
  if (gameState.queue.length >= MAX_QUEUE) return;

  const baseHp = 100;
  const player = {
    username: cleanUser,
    hp: baseHp + extraHp,
    maxHp: baseHp + extraHp,
    source,
    joinedAt: Date.now(),
    avatar: getAvatarColor(cleanUser),
  };

  gameState.queue.push(player);
  console.log(`\n🎉 [QUEUE] 👤 @${cleanUser} BERHASIL MASUK ANTREAN (via ${source})! Total: ${gameState.queue.length}\n`);
  broadcast('player_join', { player, queueLength: gameState.queue.length });
  broadcast('queue_update', { queue: gameState.queue.slice(0, MAX_QUEUE) });
}

function getAvatarColor(username) {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD'];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function giftToHp(diamondValue) {
  return Math.max(25, diamondValue * 25);
}

// ─────────────────────────────────────────
// TIKTOK LIVE FREE CONNECTOR ENGINE
// ─────────────────────────────────────────
let tiktokLiveConnection = null;
let retryCount = 0;
let retryTimer = null;
let browserInstance = null;

function scheduleRetry(delayMs = 12000) {
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = setTimeout(() => {
    retryCount++;
    connectTikTok();
  }, delayMs);
}

async function startHeadlessLiveWatcher() {
  if (browserInstance) {
    try { await browserInstance.close(); } catch (e) {}
    browserInstance = null;
  }

  try {
    const puppeteer = (await import('puppeteer')).default;
    const { deserializeWebSocketMessage } = await import('tiktok-live-connector');
    const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

    console.log(`[TikTok CDP] 🚀 Memulai listener CDP WebSocket untuk @${TIKTOK_USERNAME}...`);

    browserInstance = await puppeteer.launch({
      executablePath: chromePath,
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-notifications',
        '--mute-audio',
        '--window-size=1280,800',
      ],
    });

    const page = await browserInstance.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // ── Inject session cookie BEFORE navigating ──
    if (TIKTOK_SESSION_ID) {
      await page.setCookie(
        { name: 'sessionid',    value: TIKTOK_SESSION_ID, domain: '.tiktok.com', path: '/', httpOnly: true,  secure: true },
        { name: 'sessionid_ss', value: TIKTOK_SESSION_ID, domain: '.tiktok.com', path: '/', httpOnly: true,  secure: true },
        { name: 'sid_tt',       value: TIKTOK_SESSION_ID, domain: '.tiktok.com', path: '/', httpOnly: false, secure: true }
      );
      console.log(`[TikTok CDP] 🍪 Session cookie diinjeksi sebelum navigasi.`);
    } else {
      console.log(`[TikTok CDP] ⚠️ Tidak ada TIKTOK_SESSION_ID. Chat mungkin tidak terkirim tanpa login!`);
    }

    // ── Aktifkan CDP di SEMUA target (halaman utama + worker + iframe) ──
    const seenChatIds = new Set();
    const attachedTargets = new Set();

    const handleCDPSession = async (cdpSess) => {
      if (attachedTargets.has(cdpSess)) return;
      attachedTargets.add(cdpSess);

      cdpSess.on('Network.webSocketFrameReceived', async ({ response }) => {
        try {
          if (!response.payloadData || response.payloadData.length < 10) return;

          const buf = Buffer.from(response.payloadData, 'base64');
          const decoded = await deserializeWebSocketMessage(buf);
          const messages = decoded?.protoMessageFetchResult?.messages || [];

          // Debug: log setiap frame yang masuk
          if (messages.length > 0) {
            const types = messages.map(m => m.decodedData?.type || m.method || '?').join(', ');
            console.log(`[CDP DEBUG] Frame: ${messages.length} pesan → [${types}]`);
          } else if (decoded?.protoMessageFetchResult) {
            console.log(`[CDP DEBUG] Frame decode OK tapi 0 pesan`);
          } else {
            console.log(`[CDP DEBUG] Frame tidak bisa di-decode (len=${buf.length})`);
          }

          for (const m of messages) {
            if (!m.decodedData) continue;
            const { type, data } = m.decodedData;

            // ── Chat Event ──
            if (type === 'WebcastChatMessage') {
              const chatId = String(data?.msgId || data?.eventDetails?.msgId || '');
              if (chatId && seenChatIds.has(chatId)) continue;
              if (chatId) {
                seenChatIds.add(chatId);
                if (seenChatIds.size > 500) seenChatIds.delete(seenChatIds.values().next().value);
              }

              const username = data?.user?.uniqueId || data?.user?.nickname || 'Viewer';
              const comment  = data?.comment || data?.content || '';
              if (!comment) continue;

              console.log(`💬 [TikTok CDP Chat] @${username}: "${comment}"`);

              const lower = comment.toLowerCase().trim();
              const isJoin = lower === 'join' ||
                             lower === 'ikut' ||
                             lower === 'gas' ||
                             lower === 'main' ||
                             lower === 'masuk' ||
                             lower === 'daftar' ||
                             lower === '1' ||
                             lower.includes('join') ||
                             lower.includes('ikut') ||
                             lower.includes('gas');

              if (isJoin) {
                console.log(`🎮 [QUEUE] @${username} ketik "${comment}" → Masuk antrean!`);
                addToQueue(username, 'chat');
              }

              broadcast('chat_message', { username, comment });
            }

            // ── Like Event ──
            if (type === 'WebcastLikeMessage') {
              const username  = data?.user?.uniqueId || data?.user?.nickname || 'Liker';
              const likeCount = data?.count || data?.likeCount || 1;
              if (!gameState.likeCounters[username]) gameState.likeCounters[username] = 0;
              gameState.likeCounters[username] += likeCount;
              if (gameState.likeCounters[username] >= LIKE_THRESHOLD) {
                addToQueue(username, 'like');
                gameState.likeCounters[username] = 0;
              }
              broadcast('like_update', { username, total: gameState.likeCounters[username], threshold: LIKE_THRESHOLD });
            }

            // ── Follow Event ──
            if (type === 'WebcastSocialMessage') {
              const username = data?.user?.uniqueId || data?.user?.nickname;
              if (username) {
                console.log(`👤 [FOLLOW] @${username} follow host → Masuk antrean!`);
                addToQueue(username, 'follow');
              }
            }

            // ── Gift Event ──
            if (type === 'WebcastGiftMessage') {
              const username = data?.user?.uniqueId || data?.user?.nickname;
              const diamonds = data?.gift?.diamondCount || data?.diamondCount || 1;
              const giftName = data?.gift?.name || data?.giftName || 'Gift';
              const hpBonus  = Math.max(25, diamonds * 25);
              if (username) {
                console.log(`🎁 [GIFT] @${username} kirim ${giftName} (${diamonds} 💎) → +${hpBonus} HP!`);
                if (!gameState.inGame.has(username) && !gameState.queue.find(u => u.username === username)) {
                  addToQueue(username, 'gift', hpBonus);
                }
                broadcast('gift_heal', { username, giftName, diamondValue: diamonds, hpBonus });
              }
            }
          }
        } catch (e) {
          // Ignore non-protobuf frames
        }
      });

      cdpSess.on('Network.webSocketCreated', ({ url }) => {
        if (url.includes('tiktok.com') || url.includes('tiktok')) {
          console.log(`[TikTok CDP] 🔌 WebSocket terbuka: ${url.substring(0, 80)}...`);
        }
      });

      await cdpSess.send('Network.enable').catch(() => {});
    };


    // Attach ke target page utama - AWAIT Network.enable sebelum navigate!
    const mainCdp = await page.target().createCDPSession();
    await mainCdp.send('Network.enable');  // ← WAJIB await sebelum goto!
    handleCDPSession(mainCdp);

    // Attach ke SEMUA target baru yang dibuat oleh browser (worker, iframe, dll)
    const browser = browserInstance;
    browser.on('targetcreated', async (target) => {
      try {
        const cdpSess = await target.createCDPSession();
        handleCDPSession(cdpSess);
      } catch (e) {}
    });

    console.log(`[TikTok CDP] 🌐 Membuka https://www.tiktok.com/@${TIKTOK_USERNAME}/live...`);
    await page.goto(`https://www.tiktok.com/@${TIKTOK_USERNAME}/live`, {
      waitUntil: 'domcontentloaded',
      timeout: 45000,
    });


    // Dismiss modal secara periodik selama 30 detik pertama
    const dismissInterval = setInterval(async () => {
      try {
        await page.evaluate(() => {
          for (const b of document.querySelectorAll('button, div[role="button"]')) {
            const t = (b.innerText || '').toLowerCase().trim();
            if (['got it', 'close', 'tutup', 'mengerti', 'log in'].includes(t)) b.click();
          }
          document.querySelectorAll('[data-e2e="modal-close-icon"], button[aria-label="Close"], [class*="ModalClose"]')
            .forEach(b => b.click());
        });
      } catch (e) {}
    }, 2000);
    setTimeout(() => clearInterval(dismissInterval), 30000);

    console.log(`[TikTok CDP] ✅ Siap! Memantau SEMUA target WebSocket TikTok...`);
    isConnected = true;
    broadcast('tiktok_status', { connected: true, username: TIKTOK_USERNAME });

    // Auto-reload halaman setiap 90 detik jika tidak ada frame masuk
    // (handle kasus live baru dimulai setelah server sudah jalan)
    let lastFrameTime = Date.now();
    const originalFrameHandler = cdpSess => {
      // Update lastFrameTime setiap kali ada frame
    };

    setInterval(async () => {
      const elapsed = Date.now() - lastFrameTime;
      if (elapsed > 90000) {
        console.log(`[TikTok CDP] 🔄 Tidak ada frame selama 90 detik, reload halaman...`);
        lastFrameTime = Date.now();
        try {
          await page.goto(`https://www.tiktok.com/@${TIKTOK_USERNAME}/live`, {
            waitUntil: 'domcontentloaded',
            timeout: 30000,
          });
          console.log(`[TikTok CDP] 🔄 Halaman di-reload, menunggu live dimulai...`);
        } catch (e) {}
      }
    }, 30000);

    // Update lastFrameTime saat ada frame
    mainCdp.on('Network.webSocketFrameReceived', () => { lastFrameTime = Date.now(); });

  } catch (err) {
    console.error(`[TikTok CDP] ❌ Error: ${err.message}`);
    isConnected = false;
  }
}



function connectTikTok() {
  if (tiktokLiveConnection) {
    try { tiktokLiveConnection.removeAllListeners(); } catch (e) {}
    try { tiktokLiveConnection.disconnect(); } catch (e) {}
    tiktokLiveConnection = null;
  }

  isConnected = false;

  const connOptions = {
    enableExtendedGiftInfo: true,
    processInitialData: false,
    fetchRoomInfoOnConnect: true,
  };

  if (SIGN_API_KEY) {
    connOptions.signApiKey = SIGN_API_KEY;
    SignConfig.apiKey = SIGN_API_KEY;
    console.log(`[TikTok] 🔑 Menggunakan Sign API Key: ${SIGN_API_KEY.substring(0, 10)}...`);
  }

  if (TIKTOK_SESSION_ID) {
    connOptions.sessionId = TIKTOK_SESSION_ID;
    console.log(`[TikTok] 🍪 Menggunakan Session ID: ${TIKTOK_SESSION_ID.substring(0, 8)}...`);
  }

  try {
    tiktokLiveConnection = new TikTokLiveConnection(TIKTOK_USERNAME, connOptions);
  } catch (err) {
    console.error('[TikTok] Init error:', err.message);
    startHeadlessLiveWatcher();
    return;
  }


  // ── CHAT EVENT ──
  tiktokLiveConnection.on('chat', (data) => {
    const username = data.uniqueId || data.nickname || 'Viewer';
    const comment = (data.comment || '').toLowerCase().trim();

    console.log(`💬 [TikTok Chat] @${username}: "${comment}"`);

    const isJoin = comment.includes('join') ||
                   comment.includes('ikut') ||
                   comment.includes('gas') ||
                   comment.includes('main') ||
                   comment.includes('masuk') ||
                   comment.includes('daftar') ||
                   comment === '1';

    if (isJoin) {
      console.log(`🎮 [MATCH] @${username} minta join!`);
      addToQueue(username, 'chat');
    }
  });

  // ── LIKE EVENT ──
  tiktokLiveConnection.on('like', (data) => {
    const username = data.uniqueId || data.nickname || 'Liker';
    const likeCount = data.likeCount || 1;
    if (!gameState.likeCounters[username]) gameState.likeCounters[username] = 0;
    gameState.likeCounters[username] += likeCount;

    console.log(`❤️ [LIKE] @${username} (${gameState.likeCounters[username]}/${LIKE_THRESHOLD} likes)`);

    if (gameState.likeCounters[username] >= LIKE_THRESHOLD) {
      console.log(`❤️ [LIKE TARGET] @${username} mencapai ${LIKE_THRESHOLD} likes -> Masuk Antrean!`);
      addToQueue(username, 'like');
      gameState.likeCounters[username] = 0;
    }

    broadcast('like_update', {
      username,
      total: gameState.likeCounters[username],
      threshold: LIKE_THRESHOLD,
    });
  });

  // ── FOLLOW EVENT ──
  tiktokLiveConnection.on('follow', (data) => {
    const username = data.uniqueId || data.nickname;
    console.log(`👤 [FOLLOW] @${username} follow host -> Masuk Antrean!`);
    addToQueue(username, 'follow');
  });

  // ── GIFT EVENT ──
  tiktokLiveConnection.on('gift', (data) => {
    const username = data.uniqueId || data.nickname;
    const diamondValue = data.diamondCount || data.giftValue || 1;
    const giftName = data.giftName || 'Gift';
    const hpBonus = giftToHp(diamondValue);

    console.log(`🎁 [GIFT] @${username} kirim ${giftName} (${diamondValue} koin) -> +${hpBonus} HP!`);

    if (!gameState.inGame.has(username) && !gameState.queue.find(u => u.username === username)) {
      addToQueue(username, 'gift', hpBonus);
    }

    broadcast('gift_heal', { username, giftName, diamondValue, hpBonus });
  });

  // ── DISCONNECTED ──
  tiktokLiveConnection.on('disconnected', (reason) => {
    isConnected = false;
    console.log(`[TikTok] Disconnected:`, reason);
    broadcast('tiktok_status', { connected: false, reason });
    scheduleRetry(10000);
  });

  // ── ERROR ──
  tiktokLiveConnection.on('error', () => {});

  console.log(`[TikTok] 🔌 Menghubungkan ke @${TIKTOK_USERNAME}... (percobaan #${retryCount + 1})`);

  tiktokLiveConnection.connect()
    .then((state) => {
      isConnected = true;
      retryCount = 0;
      console.log(`\n🎉 [TikTok] ✅ BERHASIL TERHUBUNG ke @${TIKTOK_USERNAME}! Room ID: ${state?.roomId || 'aktif'}`);
      broadcast('tiktok_status', { connected: true, username: TIKTOK_USERNAME, roomId: state?.roomId });
    })
    .catch((err) => {
      isConnected = false;
      const msg = (err?.message || String(err)).toLowerCase();
      console.error(`[TikTok] ⚠️ Gagal konek via API (${err?.message || err})`);

      if (msg.includes('offline') || msg.includes('ended')) {
        console.log(`[TikTok] 📴 Akun @${TIKTOK_USERNAME} sedang tidak LIVE.`);
        scheduleRetry(25000);
      } else if (!browserInstance) {
        console.log(`[TikTok] ⚡ Beralih otomatis ke Engine Free Direct Scraper...`);
        startHeadlessLiveWatcher();
      }

      broadcast('tiktok_status', { connected: isConnected, error: msg });
    });

}

connectTikTok();

// ─────────────────────────────────────────
// REST API — MOCK & CONTROL
// ─────────────────────────────────────────
app.get('/status', (req, res) => {
  res.json({
    tiktok: { connected: isConnected, username: TIKTOK_USERNAME },
    queue: gameState.queue.length,
    inGame: [...gameState.inGame],
  });
});

app.post('/mock/join', (req, res) => {
  const username = req.body.username || `User_${Math.floor(Math.random() * 9999)}`;
  addToQueue(username, 'mock_chat');
  res.json({ success: true, username, queue: gameState.queue.length });
});

app.post('/mock/like', (req, res) => {
  const username = req.body.username || `Liker_${Math.floor(Math.random() * 9999)}`;
  addToQueue(username, 'mock_like');
  res.json({ success: true, username, queue: gameState.queue.length });
});

app.post('/mock/follow', (req, res) => {
  const username = req.body.username || `Follower_${Math.floor(Math.random() * 9999)}`;
  addToQueue(username, 'mock_follow');
  res.json({ success: true, username, queue: gameState.queue.length });
});

app.post('/mock/gift', (req, res) => {
  const username = req.body.username || `Gifter_${Math.floor(Math.random() * 9999)}`;
  const diamonds = parseInt(req.body.diamonds) || 1;
  const hpBonus = giftToHp(diamonds);

  if (!gameState.inGame.has(username) && !gameState.queue.find(u => u.username === username)) {
    addToQueue(username, 'mock_gift', hpBonus);
  }

  broadcast('gift_heal', { username, giftName: 'MockGift', diamondValue: diamonds, hpBonus });
  res.json({ success: true, username, hpBonus, queue: gameState.queue.length });
});

app.post('/mock/reset', (req, res) => {
  gameState.queue = [];
  gameState.champion = null;
  gameState.challenger = null;
  gameState.inGame.clear();
  gameState.likeCounters = {};
  broadcast('game_reset', {});
  res.json({ success: true });
});

app.get('/queue', (req, res) => {
  res.json({ queue: gameState.queue, inGame: [...gameState.inGame] });
});

app.post('/game/sync', (req, res) => {
  const { champion, challenger, action } = req.body;

  if (action === 'start_battle' && champion && challenger) {
    gameState.champion = champion;
    gameState.challenger = challenger;
    gameState.inGame.add(champion.username);
    gameState.inGame.add(challenger.username);
  }

  if (action === 'ko' && req.body.loser) {
    const loser = req.body.loser;
    gameState.inGame.delete(loser);
    gameState.queue = gameState.queue.filter(u => u.username !== loser);
  }

  if (action === 'next_challenger') {
    if (gameState.queue.length > 0) {
      const next = gameState.queue.shift();
      gameState.challenger = next;
      if (champion) {
        gameState.champion = champion;
        gameState.inGame.add(champion.username);
      }
      gameState.inGame.add(next.username);
      broadcast('queue_update', { queue: gameState.queue });
      broadcast('next_challenger', { challenger: next });
      return res.json({ success: true, challenger: next });
    }
    return res.json({ success: false, message: 'Queue empty' });
  }

  broadcast('queue_update', { queue: gameState.queue });
  res.json({ success: true });
});

app.get('/next', (req, res) => {
  const next = gameState.queue[0] || null;
  res.json({ next, queueLength: gameState.queue.length });
});

app.post('/tiktok/reconnect', (req, res) => {
  console.log('[TikTok] 🔄 Manual reconnect triggered via API');
  retryCount = 0;
  connectTikTok();
  res.json({ success: true, message: 'Reconnect triggered' });
});

// ─────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} sudah digunakan oleh proses lain!`);
    console.error(`   Jalankan: lsof -ti:${PORT} | xargs kill -9`);
    console.error(`   Lalu restart server.\n`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
  }
});

server.listen(PORT, () => {
  console.log(`\n🎮 Stickman Arena Backend running on port ${PORT}`);
  console.log(`📡 WebSocket: ws://localhost:${PORT}`);
  console.log(`🔧 Mock API:  http://localhost:${PORT}`);
  console.log(`🎵 TikTok:    @${TIKTOK_USERNAME}\n`);
});
