# Trip Link — gemini.md (инструкции для Antigravity / AI-агентов)

## 1) Цель проекта
Сделать MVP веб-приложения **Trip Link**:
- Организатор быстро создаёт страницу поездки (Trip Link) из текста поста (IG/TG/FB) с автозаполнением полей.
- Альтернатива: вставить **Telegram message URL** → подтянуть текст/медиа через публичный web preview → автозаполнение.
- Участник открывает Trip Link и оставляет заявку **без регистрации**.
- Организатор в кабинете видит **Inbox заявок** и управляет статусами/местами.

## 2) Жёсткие границы MVP (anti-goals)
Не делаем в MVP:
- кросспостинг в Instagram/Telegram/Facebook (никаких API интеграций для публикации)
- сбор оплат внутри платформы (никаких Stripe/Revolut интеграций)
- чаты/мессенджер внутри приложения
- сложную верификацию личности (только соцссылка/контакты в заявке)
- рекомендации/матчинг “по интересам” и т.п.

## 3) Tech stack (фиксируем)
- Framework: **Next.js 15** (App Router)
- Language: **TypeScript**
- Styling/UI: **Tailwind CSS** (без UI-комбайнов, можно shadcn/ui точечно)
- Auth + DB: **Supabase** (Postgres + Supabase Auth)
- Tests:
  - Unit: **Vitest** (или Jest, но предпочтительно Vitest)
  - E2E: **Playwright**
- Lint/format: ESLint + Prettier

## 4) Архитектура и структура проекта
Используем App Router:
- `app/` — страницы и layout
- `app/api/` — route handlers (server-side)
- `lib/` — чистая бизнес-логика (парсинг, утилиты)
- `components/` — UI-компоненты (без бизнес-логики)
- `supabase/` — SQL миграции/политики (если выбран такой подход)

Принципы:
- Один файл — одна ответственность.
- Не плодить огромные компоненты. Если файл > 250–300 строк — рефакторить.
- Логику парсинга держать в `lib/` и покрывать unit-тестами.

## 5) Модель данных (Supabase)
Таблицы (минимум):

### `trips`
- `id` uuid pk
- `owner_id` uuid (references auth.users)
- `slug` text unique (для публичного URL)
- `title` text
- `description_raw` text (исходный текст, который вставили)
- `description_clean` text (отредактированная версия)
- `start_date` date nullable
- `end_date` date nullable
- `from_city` text nullable
- `to_place` text nullable
- `price_amount` numeric nullable
- `price_currency` text nullable (например PLN/EUR)
- `price_text` text nullable (если “делим расходы”)
- `seats_total` int nullable
- `seats_left` int nullable
- `cover_image_url` text nullable
- `status` text enum: `draft | published | closed`
- `created_at` timestamptz default now()

### `applications`
- `id` uuid pk
- `trip_id` uuid references trips(id) on delete cascade
- `name` text
- `contact_phone` text nullable
- `contact_instagram` text nullable
- `contact_telegram` text nullable
- `seats_requested` int default 1
- `note` text nullable
- `status` text enum: `new | approved | waitlist | rejected`
- `created_at` timestamptz default now()

### RLS (обязательно)
- `trips`: owner может CRUD свои trips; публично можно читать только `status='published'` по `slug`.
- `applications`: owner trip может читать/обновлять; публично можно **создавать** application на published trip (insert policy).
- Никогда не выдавать приватные данные без RLS.

## 6) Авторизация и доступы
- Организатор: **Supabase Auth** — Magic Link (email) + Google OAuth (если быстро).
- Участник: **без авторизации** (форма заявки).
- Важно: все admin/organizer действия только после проверки session.

## 7) Основные экраны (routes)
### Публичные
- `GET /t/[slug]` — Trip Link page:
  - описание, даты, места, цена
  - CTA “Оставить заявку” (форма)
  - после submit: “Заявка отправлена”

### Организатор
- `GET /login` — вход (magic link / oauth)
- `GET /dashboard` — список поездок + счетчики (заявки/места/статус)
- `GET /dashboard/trips/new` — создание (wizard)
- `GET /dashboard/trips/[id]` — редактирование trip + **Inbox заявок** (таблица/карточки)
- `POST /dashboard/trips/[id]/close` (или action) — закрыть набор

## 8) Создание Trip Link (wizard) — 3 режима
UI делаем вкладками:
1) **Paste Text**
2) **Telegram URL**
3) **Manual** (на случай, если парсер не сработал)

### 8.1 Paste Text → автозаполнение
- Поле для вставки текста.
- После вставки: запускаем `lib/extractFromText.ts` и заполняем поля.
- Пользователь может править любые поля перед publish.
- Парсер возвращает:
  - `fields` (предложения)
  - `confidence` (0..1)
  - `warnings` (что не удалось извлечь)

### 8.2 Telegram URL → публичный web preview
- Вставка URL вида `https://t.me/<channel>/<messageId>`
- Серверный route handler: `POST /api/import/telegram`
  - Валидация домена/формата.
  - `fetch` HTML страницы.
  - Извлечение:
    - текст сообщения
    - ссылок
    - изображений/preview (если есть в HTML)
  - Возврат JSON: `{text, mediaUrls[]}`
- Далее текст идёт в `extractFromText` и автозаполняет поля.
- Не использовать Apify в MVP.
- Не использовать “скрейпинг Instagram” в MVP.

## 9) Парсер (extractFromText) — требования
- Не пытаться “идеально понимать”. Нужно 80/20.
- Поддержка форматов дат:
  - `17.01`, `17/01`, `17-18.01`, `07.02-14.02`
  - слова месяцев RU/PL/EN (минимально)
- Цена:
  - `190 zł`, `190pln`, `€150`, `150 eur`
  - “делим расходы” → в `price_text`
- Места:
  - “2 места”, “2 miejsca”, “last 2 spots”, “ostatnie miejsca”
- Города/локации:
  - пытаться извлечь “from/to” эвристиками (ключевые слова: `выезд`, `start`, `from`, `z`, `z miasta`, `do`, `to`)
  - если не уверены — оставлять пустым и дать warning.

Обязательные поля для publish:
- `title` (если не извлечено — авто: `${to_place ?? 'Trip'} ${start_date ?? ''}` и дать warning)
- `status` при publish = `published`

## 10) Inbox заявок (организаторский кабинет)
На странице `GET /dashboard/trips/[id]`:
- Список заявок (applications) сортировка: новые сверху.
- Кнопки статуса:
  - Approve / Waitlist / Reject
- При Approve:
  - уменьшать `seats_left` (но не уходить в минус)
  - если мест нет — переводить в waitlist или блокировать approve с сообщением
- При Reject/Waitlist seats_left не меняем (если ранее approved — нужно вернуть место; учитываем переходы статусов)
- Нужна простая бизнес-логика статусов (state transitions):
  - new → approved/waitlist/rejected
  - approved → waitlist/rejected (возвращаем место)
  - waitlist/rejected → approved (если есть место)

## 11) Безопасность и качество
- Все server actions / API routes должны проверять auth для organizer-операций.
- Санация ввода:
  - trimming
  - ограничения длины полей (title/description/note)
  - базовая защита от XSS (не рендерить raw HTML; использовать plain text)
- Telegram import:
  - allowlist доменов: `t.me`, `telegram.me` (если нужно)
  - timeout и обработка ошибок fetch
  - кеширование можно позже, но не обязательно в MVP.

## 12) Тестирование (обязательно минимум)
### Unit (Vitest)
- `extractFromText` покрыть минимум 20 кейсами:
  - разные форматы дат/цен/мест
  - RU/PL/EN фразы
  - пустые/шумные тексты

### E2E (Playwright)
Сценарии:
1) Organizer login (mock или реальный env)
2) Create trip via Paste Text → publish
3) Open public trip page → submit application
4) Organizer opens Inbox → approve application → seats_left changes

## 13) Definition of Done (каждый инкремент)
Считаем фичу готовой, если:
- UI работает на мобиле (responsive)
- Ошибки показаны пользователю (toast/inline)
- Есть минимальные тесты
- Нет обхода RLS (проверить руками и тестом)
- Флоу “create → publish → apply → inbox” проходит без ручных костылей

## 14) Как работать агентам (важные правила)
- Сначала план (Implementation Plan) → потом код.
- Делать маленькие PR-логические шаги, не гигантские коммиты.
- Если непонятно — выбирать самый простой вариант, который укладывается в MVP.
- Не добавлять новые сущности/таблицы “на будущее” без явной необходимости.
- Любое решение, которое требует скрейпинга Instagram или платёжных интеграций — отклонять.

## 15) Переменные окружения (пример)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (только server-side при необходимости)
- `NEXT_PUBLIC_APP_URL` (для magic link redirect)

---

### Ключевая цель
Сделать продукт, который решает боль организатора: **один линк + единый inbox заявок**.
Любые “красивые” фичи, которые не влияют на этот флоу — в бэклог.
