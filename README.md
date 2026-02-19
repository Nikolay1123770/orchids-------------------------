# SMG VPN - Полнофункциональное VPN-приложение

[![React Native](https://img.shields.io/badge/React%20Native-0.81-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54.0-black.svg)](https://expo.dev/)
[![Hono](https://img.shields.io/badge/Hono-4.9-orange.svg)](https://hono.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

Профессиональное VPN-приложение с интеграцией ЮMoney для приема платежей и реальным VPN-подключением через VLESS протокол.

## Возможности

### Для пользователей
- Быстрая регистрация и авторизация
- Подписка с оплатой через ЮMoney
- Реальное VPN-подключение (VLESS WebSocket)
- Статистика трафика в реальном времени
- Несколько VPN-серверов
- Красивый и интуитивный интерфейс

### Технические возможности
- Автоматическая активация подписки после оплаты
- Webhook интеграция с ЮMoney
- SQLite база данных
- JWT авторизация
- Интеграция с 3x-ui панелью
- Real-time статистика

## Скриншоты

Приложение включает:
- Экран авторизации/регистрации
- Главный экран с кнопкой подключения
- Экран выбора тарифа и оплаты
- Список серверов
- Статистика трафика
- Настройки

## Быстрый старт

```bash
# 1. Клонируйте репозиторий
git clone <your-repo>
cd smg-vpn

# 2. Установите зависимости backend
cd backend
npm install
cd ..

# 3. Установите зависимости frontend
cd frontend
npm install
cd ..

# 4. Запустите backend
cd backend
npm run dev

# 5. В новом терминале запустите frontend
cd frontend
npm run dev
```

Подробная инструкция: [SETUP.md](SETUP.md)

## Структура проекта

```
smg-vpn/
├── backend/                 # Backend на Hono.js
│   ├── src/
│   │   ├── index.ts        # API сервер
│   │   ├── db.ts           # База данных (SQLite)
│   │   └── xui.ts          # 3x-ui интеграция
│   └── smgvpn.db           # SQLite БД
│
├── frontend/                # React Native (Expo)
│   ├── app/
│   │   ├── (tabs)/         # Табы (главная, серверы, статистика, настройки)
│   │   ├── auth.tsx        # Авторизация
│   │   └── subscription.tsx # Оплата подписки
│   └── lib/
│       └── api.ts          # API клиент
│
├── SETUP.md                # Инструкция по установке
├── YOOMONEY_SETUP.md       # Настройка ЮMoney
└── USER_GUIDE.md           # Руководство для пользователей
```

## Технологии

### Backend
- **Hono.js** - Быстрый веб-фреймворк
- **SQLite** - Легковесная база данных
- **JWT** - Авторизация
- **bcryptjs** - Хеширование паролей
- **3x-ui API** - Управление VPN клиентами

### Frontend
- **React Native** - Мобильный фреймворк
- **Expo** - Инструментарий для разработки
- **Expo Router** - Навигация
- **Lucide Icons** - Иконки
- **TypeScript** - Типизация

### VPN
- **Протокол**: VLESS
- **Транспорт**: WebSocket
- **Панель**: 3x-ui
- **Сервер**: 213.176.77.13 (Франкфурт, Германия)

## API Документация

### Auth
```typescript
POST /api/auth/register
Body: { email: string, password: string }
Response: { success: boolean, token: string, user: User }

POST /api/auth/login
Body: { email: string, password: string }
Response: { success: boolean, token: string, user: User, subscription: Subscription }

GET /api/auth/me
Headers: { Authorization: Bearer <token> }
Response: { success: boolean, user: User, subscription: Subscription }
```

### Подписка
```typescript
GET /api/plans
Response: { success: boolean, plans: Plan[] }

POST /api/payment/create
Headers: { Authorization: Bearer <token> }
Body: { plan: string }
Response: { success: boolean, payUrl: string, label: string, amount: number }

GET /api/payment/status?label=<label>
Headers: { Authorization: Bearer <token> }
Response: { success: boolean, status: string, confirmedAt: number }
```

### VPN
```typescript
POST /api/vpn/connect
Headers: { Authorization: Bearer <token> }
Response: { success: boolean, config: VPNConfig, subscription: Subscription }

GET /api/vpn/traffic
Headers: { Authorization: Bearer <token> }
Response: { success: boolean, client: { down: number, up: number } }

GET /api/vpn/status
Response: { success: boolean, online: boolean, ping: number }
```

## Тарифы

| Период | Цена | За день |
|--------|------|---------|
| 1 месяц | 50₽ | ~1.7₽ |
| 3 месяца | 150₽ | ~1.7₽ |
| 6 месяцев | 300₽ | ~1.7₽ |
| 12 месяцев | 600₽ | ~1.6₽ |

## Конфигурация

### Backend Environment

```bash
JWT_SECRET=smgvpn_secret_2025_$#@!
YOOMONEY_TOKEN=4100118889570559.5471FE93...
YOOMONEY_WALLET=4100118889570559
BACKEND_URL=https://your-backend-url.com
```

### Frontend Environment

```bash
EXPO_PUBLIC_BACKEND_URL=https://your-backend-url.com
```

## Настройка ЮMoney

1. Получите токен доступа в настройках ЮMoney
2. Настройте HTTP-уведомления (webhook)
3. Укажите URL: `https://your-backend.com/api/payment/webhook`
4. Проверьте работу через тестовый платеж

Подробнее: [YOOMONEY_SETUP.md](YOOMONEY_SETUP.md)

## Деплой

### Backend

```bash
# Запуск в production
cd backend
npm run build
npm run start
```

Рекомендуемые платформы:
- Railway.app
- Render.com
- DigitalOcean
- VPS с Docker

### Frontend

```bash
# Создание билда для Android
cd frontend
eas build --platform android

# Создание билда для iOS
eas build --platform ios
```

## Безопасность

- JWT токены с истечением срока действия
- Bcrypt хеширование паролей
- SHA1 проверка webhook от ЮMoney
- CORS защита
- SQL injection защита (prepared statements)

## Тестирование

```bash
# Backend typecheck
cd backend
npm run typecheck

# Frontend typecheck
cd frontend
npm run typecheck

# Linting
npm run lint
```

## Troubleshooting

### Backend не запускается
```bash
# Проверьте порт
lsof -i :3002
# Убедитесь в наличии зависимостей
npm install
```

### Frontend не подключается
- Проверьте `EXPO_PUBLIC_BACKEND_URL`
- Убедитесь, что backend запущен
- Проверьте CORS настройки

### VPN не работает
- Проверьте доступность 3x-ui панели
- Убедитесь в наличии активной подписки
- Проверьте логи backend

## Roadmap

- [ ] Поддержка iOS
- [ ] Больше VPN серверов
- [ ] Автоматическое продление подписки
- [ ] Реферальная программа
- [ ] Поддержка других протоколов (Shadowsocks, Trojan)
- [ ] Split tunneling (раздельное туннелирование)
- [ ] Статистика по странам

## Лицензия

MIT License - используйте как хотите!

## Поддержка

- Email: support@smgvpn.com
- Telegram: @smgvpn_support
- Issues: GitHub Issues

## Благодарности

- [Hono.js](https://hono.dev/) - за отличный фреймворк
- [Expo](https://expo.dev/) - за инструменты разработки
- [3x-ui](https://github.com/MHSanaei/3x-ui) - за VPN панель
- [ЮMoney](https://yoomoney.ru/) - за платежную систему

---

Сделано с ❤️ для безопасного интернета
