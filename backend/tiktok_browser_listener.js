import puppeteer from 'puppeteer-core';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

export async function startTikTokBrowserListener(username, callbacks = {}) {
  const { onChat, onJoin, onLike, onGift, onStatus } = callbacks;

  console.log(`[TikTok Browser] 🚀 Launching internal listener for @${username}...`);

  try {
    const browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: 'new', // Run silently in background without popup window
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-notifications',
        '--mute-audio',
        '--disable-extensions',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--window-size=1280,800',
      ],
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Expose Node.js callbacks to the browser window
    await page.exposeFunction('__nodeOnTikTokChat', (user, text) => {
      if (onChat) onChat(user, text);

      const comment = (text || '').toLowerCase().trim();
      const isJoin = comment.includes('join') ||
                     comment.includes('ikut') ||
                     comment.includes('gas') ||
                     comment.includes('main') ||
                     comment.includes('masuk') ||
                     comment.includes('daftar') ||
                     comment === '1';

      if (isJoin && onJoin) {
        onJoin(user, 'chat');
      }
    });

    await page.exposeFunction('__nodeOnTikTokLike', (user, count) => {
      if (onLike) onLike(user, count || 1);
    });

    await page.exposeFunction('__nodeOnTikTokGift', (user, giftName, diamonds) => {
      if (onGift) onGift(user, giftName, diamonds || 1);
    });

    const targetUrl = `https://www.tiktok.com/@${username}/live`;
    console.log(`[TikTok Browser] 🌐 Loading ${targetUrl}...`);

    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });

    console.log(`[TikTok Browser] ✅ Live page loaded! Initializing chat watcher...`);
    if (onStatus) onStatus(true);

    // Evaluate in browser to watch chat messages in DOM
    await page.evaluate(() => {
      const seenMessages = new Set();

      function extractChat() {
        // Find chat container - TikTok uses various selectors
        const chatItems = document.querySelectorAll(
          '[data-e2e="chat-message"], .tiktok-chat-item, [class*="ChatMessageContainer"], [class*="chat-item"], [class*="DivCommentItem"]'
        );

        chatItems.forEach((item) => {
          const text = item.innerText || '';
          if (!text || seenMessages.has(text)) return;
          seenMessages.add(text);

          // Keep seenMessages bounded
          if (seenMessages.size > 500) {
            const first = seenMessages.values().next().value;
            seenMessages.delete(first);
          }

          // Parse username and message
          // TikTok chat items usually contain username and comment separated by ":" or in distinct spans
          let username = '';
          let comment = '';

          const userElem = item.querySelector('[class*="User"], [class*="NickName"], [class*="username"], span');
          if (userElem) {
            username = userElem.innerText.replace(/:$/, '').trim();
            comment = text.replace(username, '').replace(/^[:\s]+/, '').trim();
          } else {
            const parts = text.split(':');
            if (parts.length >= 2) {
              username = parts[0].trim();
              comment = parts.slice(1).join(':').trim();
            } else {
              comment = text.trim();
            }
          }

          if (username && comment && window.__nodeOnTikTokChat) {
            window.__nodeOnTikTokChat(username, comment);
          }
        });
      }

      // Run every 400ms and also via MutationObserver
      setInterval(extractChat, 400);

      const observer = new MutationObserver(() => {
        extractChat();
      });

      observer.observe(document.body, { childList: true, subtree: true });
    });

    return {
      browser,
      page,
      stop: async () => {
        try { await browser.close(); } catch (e) {}
      }
    };
  } catch (err) {
    console.error(`[TikTok Browser] ❌ Error:`, err.message);
    if (onStatus) onStatus(false, err.message);
    return null;
  }
}
