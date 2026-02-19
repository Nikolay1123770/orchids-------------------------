# Настройка ЮMoney для приема платежей

## Шаг 1: Получение токена

Токен уже есть в коде:
```
YOOMONEY_TOKEN=4100118889570559.5471FE93036FACB51259800442ED5D0F29CDED2C77B14C6871BF92A581C1F86ABA3F7E9F4E7C783BB985C11F23553601954C7CBC216A723FBD010627D92285A53E0F2EA68DA75C135BA0EBB318679FF772D2CF6FB9890E70B1E813B29EDF84FC7111B5D72C598E94655E77C679595195E44141B807535C9F23F47074C47A93AD
YOOMONEY_WALLET=4100118889570559
```

## Шаг 2: Настройка HTTP-уведомлений (webhooks)

1. Войдите на https://yoomoney.ru
2. Перейдите в настройки кошелька
3. Найдите раздел "HTTP-уведомления" или "Уведомления для приложений"
4. Включите HTTP-уведомления
5. Укажите URL вашего webhook:
   ```
   https://ваш-домен.ru/api/payment/webhook
   ```

   Если используете ngrok для тестирования:
   ```
   https://xxxx-xxx-xxx-xxx-xxx.ngrok.io/api/payment/webhook
   ```

6. Сохраните настройки

## Шаг 3: Проверка webhook

Backend автоматически проверяет подпись платежа по формуле:
```
sha1(notification_type&operation_id&amount&currency&datetime&sender&codepro&secret&label)
```

Где `secret` = ваш `YOOMONEY_TOKEN`

## Как работает оплата

### 1. Создание платежа

Когда пользователь нажимает "Оплатить":
- Backend создает запись в БД с уникальным `label`
- Генерируется ссылка на QuickPay:
  ```
  https://yoomoney.ru/quickpay/confirm.xml?
    receiver=4100118889570559
    &quickpay-form=donate
    &paymentType=AC
    &sum=50
    &label=smgvpn_1_1_month_1234567890
    &successURL=https://ваш-бэкенд/api/payment/success?label=...
  ```

### 2. Оплата пользователем

- Открывается страница ЮMoney
- Пользователь вводит карту и оплачивает
- После успеха редирект на `successURL`

### 3. Webhook от ЮMoney

ЮMoney отправляет POST запрос на `/api/payment/webhook`:
```
notification_type=p2p-incoming
operation_id=12345678901234567890
amount=50.00
currency=643
datetime=2025-01-20T12:00:00Z
sender=41001234567890
codepro=false
label=smgvpn_1_1_month_1234567890
sha1_hash=...
```

### 4. Активация подписки

Backend:
1. Проверяет подпись SHA1
2. Сравнивает сумму с тарифом
3. Помечает платеж как `confirmed`
4. Создает/обновляет подписку в БД
5. Обновляет клиента в 3x-ui панели с датой истечения

### 5. Доступ к VPN

После активации пользователь может подключиться к VPN!

## Тестирование

### Тест 1: Локальная проверка webhook

```bash
curl -X POST http://localhost:3002/api/payment/webhook \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "notification_type=p2p-incoming" \
  -d "operation_id=test123" \
  -d "amount=50.00" \
  -d "currency=643" \
  -d "datetime=2025-01-20T12:00:00Z" \
  -d "sender=41001234567890" \
  -d "codepro=false" \
  -d "label=test_label" \
  -d "sha1_hash=$(echo -n 'p2p-incoming&test123&50.00&643&2025-01-20T12:00:00Z&41001234567890&false&YOOMONEY_TOKEN&test_label' | openssl sha1 | awk '{print $2}')"
```

### Тест 2: Проверка через ngrok

1. Запустите backend с ngrok:
   ```bash
   npm run dev:tunnel
   ```

2. Скопируйте ngrok URL (например: https://xxxx.ngrok.io)

3. Настройте webhook в ЮMoney на:
   ```
   https://xxxx.ngrok.io/api/payment/webhook
   ```

4. Создайте тестовый платеж в приложении

5. Оплатите реальной картой (минимум 50₽)

6. Проверьте логи backend - должно прийти уведомление от ЮMoney

## Проверка статуса платежа

Приложение автоматически проверяет статус каждые 3 секунды после создания платежа:

```typescript
GET /api/payment/status?label=smgvpn_1_1_month_1234567890

Response:
{
  "success": true,
  "status": "confirmed",  // или "pending"
  "confirmedAt": 1705752000
}
```

## Важные замечания

1. **Webhook должен быть доступен из интернета**
   - Для локальной разработки используйте ngrok
   - Для продакшена настройте домен с SSL

2. **Безопасность**
   - Backend всегда проверяет SHA1 подпись
   - Неверная подпись = отклонение платежа

3. **Label должен быть уникальным**
   - Формат: `smgvpn_{userId}_{plan}_{timestamp}`
   - Например: `smgvpn_42_3_month_1705752123456`

4. **Автоматическая активация**
   - Webhook срабатывает мгновенно после оплаты
   - Подписка активируется автоматически
   - Пользователь может сразу подключиться к VPN

## Troubleshooting

### Webhook не срабатывает
- Проверьте, что URL доступен из интернета
- Проверьте логи backend
- Убедитесь, что включены уведомления в ЮMoney

### Неверная подпись
- Проверьте правильность YOOMONEY_TOKEN
- Убедитесь, что все параметры идут в правильном порядке

### Подписка не активируется
- Проверьте сумму платежа (должна совпадать с тарифом)
- Проверьте логи backend на наличие ошибок
- Убедитесь, что платеж с таким label существует в БД
