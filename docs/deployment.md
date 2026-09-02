# Развертывание и локализация данных (Deployment & Kazakhstan Cloud)

## 1. Требования к локализации данных в Казахстане
В соответствии с Законом РК «О персональных данных и их защите», база данных, содержащая персональные данные граждан РК, должна физически находиться на территории Республики Казахстан.

Рекомендуемые провайдеры для размещения production базы данных:
- **PS Cloud Services** (Алматы / Астана)
- **Kazteleport Data Center**
- **Transtelecom Cloud (TTC)**
- **Beeline Business Cloud KZ**

## 2. Переменные окружения для Production (PostgreSQL)
```env
NODE_ENV=production
APP_URL=https://sino.kz
DATABASE_URL="postgresql://sino_db_user:secure_kz_pass@db.internal.kz:5432/sino_production?schema=public"
SESSION_SECRET="generat-super-secure-32-byte-secret-key-here"
AI_PROVIDER=gemini # или openai / mock
AI_API_KEY="your-gemini-api-key"
AI_MODEL="gemini-1.5-flash"
```

## 3. Docker сборка и запуск
```bash
# Сборка образа
docker build -t sino-app .

# Запуск через Docker Compose
docker-compose up -d
```