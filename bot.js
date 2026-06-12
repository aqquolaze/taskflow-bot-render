import express from 'express';
const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const SITE_URL = 'https://gotaskflow.ru';

// Цены на услуги в токенах
const PRICES = {
    task_creation: 'от 10 токенов',
    ai_post: '5 токенов',
    ai_script: '10 токенов',
    ai_seo: '3 токена',
    freelance_order: 'от 20 токенов'
};

app.get('/', (req, res) => {
    res.send('🤖 Бот TaskFlow работает!');
});

// Главное меню
const mainMenu = {
    inline_keyboard: [
        [
            { text: '💎 Купить токены', callback_data: 'buy_tokens' },
            { text: '💰 Мой баланс', callback_data: 'balance' }
        ],
        [
            { text: '📋 Биржа заданий', callback_data: 'tasks' },
            { text: '🤖 AI инструменты', callback_data: 'ai' }
        ],
        [
            { text: '💼 Фриланс', callback_data: 'freelance' },
            { text: '👥 Рефералы', callback_data: 'referrals' }
        ],
        [
            { text: '❓ Как заработать?', callback_data: 'how_to_earn' }
        ]
    ]
};

// Меню покупки токенов
const buyTokensMenu = {
    inline_keyboard: [
        [
            { text: '💰 100 токенов — 49₽', callback_data: 'buy_100' },
            { text: '💰 500 токенов — 199₽', callback_data: 'buy_500' }
        ],
        [
            { text: '💰 1000 токенов — 349₽', callback_data: 'buy_1000' },
            { text: '💰 5000 токенов — 1499₽', callback_data: 'buy_5000' }
        ],
        [
            { text: '⬅️ Назад', callback_data: 'back_main' }
        ]
    ]
};

app.post('/webhook', async (req, res) => {
    const message = req.body.message;
    if (!message) {
        res.sendStatus(200);
        return;
    }

    const chatId = message.chat.id;
    const text = message.text || '';
    const username = message.from?.first_name || 'друг';

    if (text === '/start') {
        const welcomeText = 
`✨ *Добро пожаловать в TaskFlow, ${username}!* ✨

💎 *Что такое TaskFlow?*

Платформа, где ты можешь:
• 💰 *Зарабатывать токены* — выполняя задания или продавая услуги
• 🚀 *Продвигать свои проекты* — создавая задания для других
• 🤖 *Использовать AI* — генерация контента за токены

🎯 *Как начать?*

1️⃣ Купи токены или заработай их
2️⃣ Создай задание или выполни чужое
3️⃣ Получай результат и новые токены!

👇 *Выбери действие в меню*`;

        await sendMessage(chatId, welcomeText, mainMenu);
        res.sendStatus(200);
        return;
    }

    res.sendStatus(200);
});

app.post('/webhook/callback', async (req, res) => {
    const callback = req.body.callback_query;
    if (!callback) {
        res.sendStatus(200);
        return;
    }

    const chatId = callback.message.chat.id;
    const data = callback.data;
    const username = callback.from?.first_name || 'пользователь';

    switch(data) {
        case 'buy_tokens':
            await sendMessage(chatId,
`💎 *Купить токены*

Выбери пакет токенов:

| Токены | Цена |
|--------|------|
| 100 | 49 ₽ |
| 500 | 199 ₽ |
| 1000 | 349 ₽ |
| 5000 | 1499 ₽ |

💳 *Способы оплаты:* карты РФ, СБП, ЮMoney

👇 *Нажми на пакет ниже*`, buyTokensMenu);
            break;

        case 'balance':
            await sendMessage(chatId,
`💰 *Твой баланс*

👤 ${username}, у тебя пока 0 токенов.

💎 *Пополни баланс:* Купи токены за рубли
📋 *Или заработай:* Выполняй задания в бирже

🎁 *Бонус:* Приведи друга → +50 токенов`);
            break;

        case 'how_to_earn':
            await sendMessage(chatId,
`💡 *Как заработать токены?*

1️⃣ *Выполняй задания*
→ Подпишись, поставь лайк, напиши комментарий
→ Получи от 1 до 100 токенов за действие

2️⃣ *Создавай задания*
→ Другие выполняют твои задания
→ Ты получаешь продвижение, они — токены

3️⃣ *Приглашай друзей*
→ За каждого друга +50 токенов
→ Ссылка: ${SITE_URL}/ref/твой_id

4️⃣ *Продавай услуги*
→ Дизайн, монтаж, разработка
→ Зарабатывай на фриланс-бирже

5️⃣ *Используй AI инструменты*
→ Создавай качественный контент
→ Привлекай больше клиентов`);
            break;

        case 'tasks':
            await sendMessage(chatId,
`📋 *Биржа заданий*

💰 *Как заработать:*
• Выполняй задания → получай токены
• Создавай задания → продвигай свои проекты

⚡ *Стоимость создания задания:* ${PRICES.task_creation}

🚀 *Перейти на сайт:* ${SITE_URL}/tasks`);
            break;

        case 'ai':
            await sendMessage(chatId,
`🤖 *AI инструменты*

💎 *Цены в токенах:*

📝 Генератор постов — ${PRICES.ai_post}
📹 Сценарии для видео — ${PRICES.ai_script}
🔍 SEO анализ текста — ${PRICES.ai_seo}
🎨 Генератор идей — 5 токенов

👉 *Попробовать:* ${SITE_URL}/ai`);
            break;

        case 'freelance':
            await sendMessage(chatId,
`💼 *Фриланс-биржа*

💎 *Как заработать:*
• Бери заказы → получай токены
• Выполняй качественно → высокий рейтинг

📝 *Разместить заказ:* ${PRICES.freelance_order}

🚀 *Перейти:* ${SITE_URL}/freelance`);
            break;

        case 'referrals':
            await sendMessage(chatId,
`👥 *Реферальная программа*

🎁 *Как получить бонус:*

1. Пригласи друга по ссылке:
\`${SITE_URL}/ref/ваш_id\`

2. Друг регистрируется
3. Вы получаете +50 токенов

✨ *Друг тоже получит 50 токенов за первую покупку!*

📊 *Твои приглашённые:* 0
💰 *Заработано:* 0 токенов`);
            break;

        // Покупка токенов
        case 'buy_100':
            await sendMessage(chatId,
`💎 *Покупка 100 токенов*

💰 Сумма: 49 ₽
🔹 Токенов: 100

👇 *Для оплаты перейди на сайт:*
${SITE_URL}/buy?package=100

💳 После оплаты токены поступят на баланс автоматически.`);
            break;

        case 'buy_500':
            await sendMessage(chatId,
`💎 *Покупка 500 токенов*

💰 Сумма: 199 ₽
🔹 Токенов: 500 (+20 бонусных!)

👇 *Оплатить:* ${SITE_URL}/buy?package=500`);
            break;

        case 'buy_1000':
            await sendMessage(chatId,
`💎 *Покупка 1000 токенов*

💰 Сумма: 349 ₽
🔹 Токенов: 1000 (+50 бонусных!)

👇 *Оплатить:* ${SITE_URL}/buy?package=1000`);
            break;

        case 'buy_5000':
            await sendMessage(chatId,
`💎 *Покупка 5000 токенов*

💰 Сумма: 1499 ₽
🔹 Токенов: 5000 (+500 бонусных!)

👇 *Оплатить:* ${SITE_URL}/buy?package=5000`);
            break;

        case 'back_main':
            await sendMessage(chatId,
`✨ *Главное меню TaskFlow* ✨\n\n💎 Токены — главная валюта проекта.\n\n🔹 Купить → потратить на услуги\n🔹 Заработать → выполняя задания\n🔹 Пригласить друзей → +50 токенов

👇 *Выбери действие:*`, mainMenu);
            break;

        default:
            await sendMessage(chatId, '⚠️ Неизвестная команда. Используй /start', mainMenu);
    }

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: callback.id })
    });

    res.sendStatus(200);
});

async function sendMessage(chatId, text, replyMarkup = null) {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const body = {
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown'
    };
    if (replyMarkup) {
        body.reply_markup = replyMarkup;
    }
    
    await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`🤖 TaskFlow Bot запущен на порту ${port}`);
});
