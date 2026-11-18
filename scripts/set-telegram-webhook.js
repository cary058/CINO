const { createHash } = require('node:crypto');
const token = process.env.TELEGRAM_BOT_TOKEN;
const configuredSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
const secret = configuredSecret
  ? createHash('sha256').update(configuredSecret).digest('base64url')
  : '';
const appUrl = (process.env.APP_URL || "").replace(/\/$/, "");

if (!token || !secret || !appUrl) {
  console.warn("Telegram webhook пропущен: проверьте переменные бота в Render.");
  process.exit(0);
}

if (!/^[A-Za-z0-9_-]{43}$/.test(secret)) {
  console.warn("Telegram webhook пропущен: секрет не удалось подготовить.");
  process.exit(0);
}

async function main() {
  const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      url: `${appUrl}/api/telegram/webhook`,
      secret_token: secret,
      allowed_updates: ["message", "callback_query"],
      drop_pending_updates: true,
    }),
  });
  const result = await response.json();
  if (!response.ok || !result.ok) {
    console.error("Telegram не подключился:", result.description || `HTTP ${response.status}`);
    return;
  }
  console.log(`Готово. Telegram подключён к ${appUrl}/api/telegram/webhook`);
}

main().catch(() => {
  console.warn("Не удалось подключиться к Telegram; сайт продолжит запуск.");
});

