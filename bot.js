import express from 'express';
const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const SITE_URL = 'https://gotaskflow.ru';

// Главное меню
const mainMenu = {
    inline_keyboard: [
        [
            { text: '📋 Биржа заданий', callback_data: 'tasks' },
            { text: '🤖 AI Инструменты', callback_data: 'ai_tools' }
        ],
        [
            { text: '⚙️ Без ИИ', callback_data: 'no_ai_tools' },
            { text: '🔥 Скоро', callback_data: 'coming_soon' }
        ],
        [
            { text: '👤 Профиль', callback_data: 'profile' },
            { text: '💰 Баланс', callback_data: 'balance' }
        ],
        [
            { text: '❓ Помощь', callback_data: 'help' }
        ]
    ]
};

// Меню AI инструментов
const aiToolsMenu = {
    inline_keyboard: [
        [
            { text: '📝 Генератор постов', callback_data: 'ai_post' },
            { text: '🎨 Генератор идей', callback_data: 'ai_ideas' }
        ],
        [
            { text: '📹 AI-резюме видео', callback_data: 'coming_soon' },
            { text: '🔍 SEO анализ', callback_data: 'coming_soon' }
        ],
        [
            { text: '📚 AI-репетитор', callback_data: 'coming_soon' },
            { text: '✍️ Анти-плагиат', callback_data: 'coming_soon' }
        ],
        [
            { text: '⬅️ Назад', callback_data: 'back_main' }
        ]
    ]
};

// Меню "Без ИИ"
const noAiToolsMenu = {
    inline_keyboard: [
        [
            { text: '⚡ Быстрые услуги', callback_data: 'fast_services' },
            { text: '🏆 Рейтинг экспертов', callback_data: 'coming_soon' }
        ],
        [
            { text: '🔄 Обменник токенов', callback_data: 'coming_soon' },
            { text: '🎁 Конкурсы', callback_data: 'coming_soon' }
        ],
        [
            { text: '📊 Личный кабинет', callback_data: 'coming_soon' },
            { text: '💼 Агрегатор вакансий', callback_data: 'coming_soon' }
        ],
        [
            { text: '⬅️ Назад', callback_data: 'back_main' }
        ]
    ]
};

// Меню "Скоро"
const comingSoonMenu = {
    inline_keyboard: [
        [
            { text: '📈 AI-аналитика трендов', callback_data: 'coming_soon_detail' },
            { text: '🎧 Голосовой AI-ассистент', callback_data: 'coming_soon_detail' }
        ],
        [
            { text: '🌍 P2P биржа', callback_data: 'coming_soon_detail' },
            { text: '📱 Мобильное приложение', callback_data: 'coming_soon_detail' }
        ],
        [
            { text: '⬅️ Назад', callback_data: 'back_main' }
        ]
    ]
};

app.get('/', (req, res) => {
    res.send('🤖 TaskFlow Bot');
});

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

🚀 *Продвигать свои проекты*
→ Создавай задания: подписки, лайки, репосты
→ Получай активную аудиторию

🤖 *Пользоваться AI инструментами*
→ Генерация постов и идей
→ Анализ и оптимизация контента

⚡ *Заказывать быстрые услуги*
→ Лайки, подписки, комментарии
→ Всё по-настоящему, мгновенно

💎 *Как получить токены?*

💰 Купить за рубли (основной способ)
🎁 Бонус за регистрацию: 100 токенов
👥 Пригласи друга: +50 токенов
🏆 Конкурсы и розыгрыши

👇 *Выбери раздел в меню*`;

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
        // === НАВИГАЦИЯ ===
        case 'back_main':
            await sendMessage(chatId, '✨ *Главное меню TaskFlow* ✨\n\nВыбери раздел:', mainMenu);
            break;

        // === РАЗДЕЛЫ ===
        case 'tasks':
            await sendMessage(chatId,
`📋 *Биржа заданий*

💎 *Что это:*
• Создавай задания → продвигай свои проекты
• Выполняй задания → получай токены для новых услуг

🚀 *Перейти на сайт:* ${SITE_URL}/tasks`);
            break;

        case 'ai_tools':
            await sendMessage(chatId,
`🤖 *AI Инструменты*

✨ *Доступно сейчас:*
📝 Генератор постов — создавай контент за секунды
🎨 Генератор идей — новые темы для видео и статей

🔮 *Скоро появится:*
📹 AI-резюме видео — выжимай суть из роликов
🔍 SEO анализ — оптимизация контента
📚 AI-репетитор — помощь в обучении
✍️ Анти-плагиат — уникальные тексты

💎 *Стоимость:* от 5 токенов

👇 *Выбери инструмент*`, aiToolsMenu);
            break;

        case 'no_ai_tools':
            await sendMessage(chatId,
`⚙️ *Инструменты без ИИ*

✨ *Доступно сейчас:*
⚡ Быстрые услуги — подписки, лайки, репосты за минуты

🔮 *Скоро появится:*
🏆 Рейтинг экспертов — топ активных пользователей
🔄 Обменник токенов — P2P торговля
🎁 Конкурсы — розыгрыши с гарантированными призами
📊 Личный кабинет — аналитика и задачи
💼 Агрегатор вакансий — работа для студентов

👇 *Выбери раздел*`, noAiToolsMenu);
            break;

        case 'coming_soon':
            await sendMessage(chatId,
`🔥 *Скоро в TaskFlow*

Новые функции, которые уже в разработке:

🤖 *AI инструменты:*
• AI-резюме для видео
• Голосовой ассистент
• AI-аналитика трендов

⚙️ *Механики:*
• P2P обменник токенов
• Мобильное приложение
• Крипто-аналитика

📅 *Следи за анонсами!*

👇 *Подробнее о функциях*`, comingSoonMenu);
            break;

        // === AI ИНСТРУМЕНТЫ (доступные) ===
        case 'ai_post':
            await sendMessage(chatId,
`📝 *Генератор постов*

💎 *Стоимость:* 5 токенов

🎯 *Выбери тему:*
• Продукт/услуга
• Личный бренд
• Развлекательный
• Обучающий

👉 *Создать пост:* ${SITE_URL}/ai/post

⚡ *Работает на GPT-4* — качество выше обычного`);
            break;

        case 'ai_ideas':
            await sendMessage(chatId,
`🎨 *Генератор идей*

💎 *Стоимость:* 5 токенов

💡 *Что сгенерируем:*
• 10 идей для TikTok
• Тренды недели
• Вирусный контент
• Рубрики для канала

👉 *Получить идеи:* ${SITE_URL}/ai/ideas

🔥 *Твои конкуренты уже используют!*`);
            break;

        // === БЕЗ ИИ (доступные) ===
        case 'fast_services':
            await sendMessage(chatId,
`⚡ *Быстрые услуги*

💎 *Цены (токены):*

📢 *Подписка* — 5 токенов
❤️ *Лайк* — 2 токена
💬 *Комментарий* — 10 токенов
🔄 *Репост* — 7 токенов
📥 *Подписчик* — 15 токенов

⏱️ *Скорость:* 5-30 минут
🛡️ *Гарантия:* всё по-настоящему

👉 *Заказать:* ${SITE_URL}/fast-services`);
            break;

        // === ПРОФИЛЬ И БАЛАНС ===
        case 'profile':
            await sendMessage(chatId,
`👤 *Мой профиль*

🔗 *Привяжи аккаунт на сайте:* ${SITE_URL}/profile

📊 *После привязки ты увидишь:*
• 💰 Баланс токенов
• 📈 Статистику заданий
• 🏆 Рейтинг
• 🎁 Бонусы

⚠️ *Токены — внутренняя валюта, рубли не выводятся.*`);
            break;

        case 'balance':
            await sendMessage(chatId,
`💰 *Твой баланс*

👤 ${username}, у тебя пока 0 токенов.

💎 *Как получить токены:*

• Купить за рубли — ${SITE_URL}/buy
• Бонус за регистрацию — 100 токенов
• Пригласить друга — +50 токенов
• Участвовать в конкурсах

📋 *На что тратить токены:*

• Создание заданий (от 10 токенов)
• AI инструменты (5 токенов)
• Быстрые услуги (от 2 токенов)

⚠️ *Токены нельзя вывести в рубли.*
Это внутренняя валюта для услуг платформы.`);
            break;

        case 'help':
            await sendMessage(chatId,
`🆘 *Помощь*

📌 *Что такое TaskFlow?*

Платформа для продвижения и использования AI инструментов за внутренние токены.

💎 *Токены — это:*
• Внутренняя валюта
• Нельзя вывести в рубли
• Можно потратить на услуги

💰 *Как получить токены:*
• Купить за рубли
• Бонус за регистрацию (100)
• Пригласить друга (+50)
• Конкурсы

📋 *На что тратить токены:*
• Создание заданий (от 10)
• AI инструменты (5)
• Быстрые услуги (от 2)

🔗 *Сайт:* ${SITE_URL}
📧 *Поддержка:* @aquozales

⚡ *Анонсы в Telegram канале!*`);
            break;

        // === ТИЗЕРЫ БУДУЩИХ ФУНКЦИЙ ===
        case 'coming_soon_detail':
            await sendMessage(chatId,
`🔥 *Будущие функции TaskFlow*

🤖 *AI-резюме для видео*
→ Загружаешь ссылку на YouTube/TikTok
→ AI выжимает главное за 30 секунд
→ Экономия часов на обучение и анализ

🎧 *Голосовой AI-ассистент*
→ Управление ботом голосом
→ Отвечает на вопросы
→ Помогает с заданиями

📈 *AI-аналитика трендов*
→ Анализ виральности
→ Прогноз популярности
→ Рекомендации по контенту

🌍 *P2P обменник токенов*
→ Продавай и покупай токены
→ Никаких комиссий
→ Защита сделок

📱 *Мобильное приложение*
→ Все функции в телефоне
→ Push-уведомления
→ Удобный интерфейс

📅 *Следи за анонсами!*`);
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
