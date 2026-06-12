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
            { text: '💰 Токены', callback_data: 'tokens_info' }
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
            { text: '🏆 Рейтинг', callback_data: 'coming_soon' }
        ],
        [
            { text: '🔄 Обменник', callback_data: 'coming_soon' },
            { text: '🎁 Конкурсы', callback_data: 'contests' }
        ],
        [
            { text: '📊 Статистика', callback_data: 'coming_soon' },
            { text: '💼 Вакансии', callback_data: 'coming_soon' }
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
            { text: '📈 AI-аналитика', callback_data: 'coming_soon_detail' },
            { text: '🎧 Голосовой AI', callback_data: 'coming_soon_detail' }
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

🤖 *Пользоваться AI инструментами*
→ Генерация постов и идей

⚡ *Заказывать быстрые услуги*
→ Лайки, подписки, комментарии

🎁 *Бонусы, конкурсы и акции*
→ Следи за обновлениями!

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

    switch(data) {
        // === НАВИГАЦИЯ ===
        case 'back_main':
            await sendMessage(chatId, '✨ *Главное меню TaskFlow* ✨\n\nВыбери раздел:', mainMenu);
            break;

        // === РАЗДЕЛЫ ===
        case 'tasks':
            await sendMessage(chatId,
`📋 *Биржа заданий*

Создавай задания для продвижения своих проектов.

🚀 *Перейти на сайт:* ${SITE_URL}/tasks`);
            break;

        case 'ai_tools':
            await sendMessage(chatId,
`🤖 *AI Инструменты*

✨ *Доступно сейчас:*
📝 Генератор постов
🎨 Генератор идей

🔮 *Скоро появится:*
📹 AI-резюме видео
🔍 SEO анализ
📚 AI-репетитор
✍️ Анти-плагиат

👇 *Выбери инструмент*`, aiToolsMenu);
            break;

        case 'no_ai_tools':
            await sendMessage(chatId,
`⚙️ *Инструменты без ИИ*

✨ *Доступно сейчас:*
⚡ Быстрые услуги

🔮 *Скоро появится:*
🏆 Рейтинг пользователей
🔄 Обменник токенов
🎁 Конкурсы и розыгрыши
📊 Личная статистика
💼 Агрегатор вакансий

👇 *Выбери раздел*`, noAiToolsMenu);
            break;

        case 'coming_soon':
            await sendMessage(chatId,
`🔥 *Скоро в TaskFlow*

Новые функции в разработке:

🤖 *AI инструменты:*
• AI-резюме для видео
• Голосовой ассистент
• AI-аналитика трендов

⚙️ *Механики:*
• P2P обменник токенов
• Мобильное приложение
• Расширенная аналитика

👇 *Подробнее*`, comingSoonMenu);
            break;

        // === AI ИНСТРУМЕНТЫ ===
        case 'ai_post':
            await sendMessage(chatId,
`📝 *Генератор постов*

👉 *Создать пост:* ${SITE_URL}/ai/post`);
            break;

        case 'ai_ideas':
            await sendMessage(chatId,
`🎨 *Генератор идей*

👉 *Получить идеи:* ${SITE_URL}/ai/ideas`);
            break;

        // === БЫСТРЫЕ УСЛУГИ ===
        case 'fast_services':
            await sendMessage(chatId,
`⚡ *Быстрые услуги*

👉 *Заказать:* ${SITE_URL}/fast-services`);
            break;

        // === ТОКЕНЫ ===
        case 'tokens_info':
            await sendMessage(chatId,
`💰 *Токены*

💎 *Что это?*
Внутренняя валюта платформы для оплаты услуг.

🎁 *Как получить?*
• Бонус за регистрацию
• Конкурсы и розыгрыши
• Приглашение друзей
• Акции и специальные предложения

📋 *На что тратить?*
• Создание заданий
• AI инструменты
• Быстрые услуги

👉 *Пополнить баланс:* ${SITE_URL}/buy`);
            break;

        // === ПРОФИЛЬ ===
        case 'profile':
            await sendMessage(chatId,
`👤 *Профиль*

🔗 *Привяжи аккаунт:* ${SITE_URL}/profile

📊 *После привязки доступно:*
• Баланс токенов
• Статистика
• История операций`);
            break;

        // === КОНКУРСЫ ===
        case 'contests':
            await sendMessage(chatId,
`🎁 *Конкурсы и розыгрыши*

Актуальные конкурсы:

🔥 *Ежедневный бонус*
Заходи на сайт каждый день и получай бонусные токены!

🏆 *Конкурс активности*
Топ-10 самых активных пользователей в конце месяца получают призы.

🎲 *Розыгрыши*
Следи за анонсами в нашем Telegram канале!

👉 *Участвовать:* ${SITE_URL}/contests`);
            break;

        // === ПОМОЩЬ ===
        case 'help':
            await sendMessage(chatId,
`🆘 *Помощь*

📌 *Разделы:*
📋 Биржа заданий — создавай задания
🤖 AI Инструменты — генерация контента
⚙️ Без ИИ — быстрые услуги
🔥 Скоро — новые функции

🔗 *Сайт:* ${SITE_URL}
📧 *Поддержка:* @aquozales

🎁 *Бонусы и конкурсы:* Следи за анонсами в канале!`);
            break;

        // === ТИЗЕРЫ ===
        case 'coming_soon_detail':
            await sendMessage(chatId,
`🔥 *Будущие функции*

🤖 *AI-резюме для видео*
→ Анализ видео за 30 секунд

🎧 *Голосовой AI-ассистент*
→ Управление голосом

📈 *AI-аналитика трендов*
→ Прогноз популярности

🌍 *P2P обменник*
→ Продавай и покупай токены

📱 *Мобильное приложение*
→ Все функции в телефоне

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
