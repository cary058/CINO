const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
const appUrl = (process.env.APP_URL || "").replace(/\/$/, "");

if (!token || !secret || !appUrl) {
  console.error("Нужны TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET и APP_URL в локальном .env.");
  process.exit(1);
}

if (!/^[A-Za-z0-9_-]{32,64}$/.test(secret)) {
  console.error("TELEGRAM_WEBHOOK_SECRET должен содержать 32–64 символа: латинские буквы, цифры, _ или -.");
  process.exit(1);
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
    console.error("Telegram не принял адрес бота. Проверь адрес сайта и секреты в Render.");
    process.exit(1);
  }
  console.log(`Готово. Telegram подключён к ${appUrl}/api/telegram/webhook`);
}

main().catch(() => {
  console.error("Не удалось связаться с Telegram. Проверь подключение к интернету.");
  process.exit(1);
});

