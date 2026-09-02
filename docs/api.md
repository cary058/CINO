# Документация REST API платформы СИНО

## 1. Аутентификация
- `POST /api/auth/register` — Регистрация нового псевдонимного аккаунта.
- `POST /api/auth/login` — Авторизация и создание безопасной сессии.
- `POST /api/auth/logout` — Завершение сессии.
- `GET /api/auth/me` — Получение данных текущего пользователя.
- `PATCH /api/auth/me` — Обновление отображаемого имени/настроек.
- `POST /api/auth/delete-account` — Полное удаление аккаунта.

## 2. Согласия и безопасность
- `POST /api/consents` — Сохранение подтверждения согласий онбординга.
- `POST /api/human/rules-accept` — Подтверждение правил перед живым чатом.
- `GET /api/safety/crisis-resources` — Получение актуальных номеров экстренных служб.

## 3. ИИ-чат
- `GET /api/ai/chats` — Список диалогов пользователя.
- `POST /api/ai/chats` — Создание нового диалога.
- `GET /api/ai/chats/:id` — Загрузка сообщений диалога.
- `PATCH /api/ai/chats/:id` — Переименование диалога / смена режима.
- `DELETE /api/ai/chats/:id` — Удаление диалога.
- `POST /api/ai/chats/:id/messages` — Отправка сообщения и генерация ответа ИИ с проверкой безопасности.

## 4. Диспетчерская и живые чаты
- `POST /api/human-requests` — Запрос помощи человека («Мне нужен человек»).
- `GET /api/human-requests` — Активное обращение пользователя.
- `GET /api/coordinator/queue` — Очередь обращений для координатора.
- `POST /api/coordinator/assign` — Назначение волонтёра/психолога.
- `POST /api/coordinator/transfer` — Передача обращения.
- `POST /api/coordinator/escalate` — Экстренная кризисная эскалация.
- `POST /api/coordinator/close` — Закрытие обращения.
- `POST /api/coordinator/notes` — Добавление закрытой служебной заметки.
- `GET /api/human/chats` — Назначенные живые чаты.
- `GET /api/human/chats/:id` — Загрузка сообщений чата с человеком.
- `POST /api/human/chats/:id/messages` — Отправка сообщения человеку (с анти-контакт фильтром).

## 5. Волонтёры и психологи
- `POST /api/volunteer/apply` — Подача заявки в волонтёры.
- `GET /api/volunteer/training` — Модули обучающего курса.
- `POST /api/volunteer/training/submit` — Проверка ответа на тест модуля.
- `PATCH /api/volunteer/status` — Переключение доступности волонтёра.
- `POST /api/professional/apply` — Заявка психолога на верификацию.
- `PATCH /api/professional/status` — Переключение доступности психолога.

## 6. Администрация и аудит
- `GET /api/admin/dashboard` — Сводные метрики платформы.
- `GET /api/admin/users` — Список пользователей и поиск.
- `PATCH /api/admin/users` — Блокировка/разблокировка пользователей.
- `PATCH /api/admin/volunteers` — Одобрение/отклонение волонтёров.
- `PATCH /api/admin/professionals` — Верификация дипломов психологов.
- `GET /api/admin/safety-events` — Журнал событий риска.
- `GET /api/admin/audit-logs` — Журнал безопасности.
- `POST /api/admin/kill-switches` — Аварийные переключатели.
- `POST /api/admin/invitations` — Генерация приглашений.
- `POST /api/reports` — Создание жалобы.
- `POST /api/reports/:id/action` — Применение модераторского действия.