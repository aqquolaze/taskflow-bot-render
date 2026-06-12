import express from 'express';
const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const SITE_URL = 'https://gotaskflow.ru';

app.get('/', (req, res) => {
    res.send('🤖 Бот TaskFlow работает!');
});

// Главное меню с категориями
const mainMenu = {
    inline_keyboard: [
        [
            { text: '📋 Биржа заданий', callback_data: 'tasks' },
            { text: '🤖 AI инструменты', callback_data: 'ai' }
        ],
        [
            { text: '💼 Фриланс', callback_data: 'freelance' },
            { text: '📊 Аналитика', callback_data: 'analytics' }
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
const aiMenu = {
    inline_keyboard: [
        [
            { text: '📝 Генератор постов', callback_data: 'ai_post' },
            { text: '🎨 Генератор идей', callback_data: 'ai_ideas' }
        ],
        [
            { text: '📹 Сценарии для видео', callback_data: 'ai_script' },
            { text: '🔍 SEO анализ', callback_data: 'ai_seo' }
        ],
        [
            { text: '⬅️ Назад', callback_data: 'back_main' }
        ]
    ]
};

// Меню фриланса
const freelanceMenu = {
    inline_keyboard: [
        [
            { text: '✏️ Дизайн', callback_data: 'freelance_design' },
            { text: '🎬 Монтаж', callback_data: 'freelance_video' }
        ],
        [
            { text: '📝 Копирайтинг', callback_data: 'freelance_copy' },
            { text: '💻 Разработка', callback_data: 'freelance_dev' }
        ],
        [
            { text: '⬅️ Назад', callback_data: 'back_main' }
        ]
    ]
};

// Обработка вебхука
app.post('/webhook', async (req, res) => {
    const message = req.body.message;
    if (!message) {
        res.sendStatus(200);
        return;
    }

    const chatId = message.chat.id;
    const text = message.text || '';
    const username = message.from?.first_name || 'друг';

    // Обработка команд
    if (text === '/start') {
        const welcomeText = 
`✨ *Добро пожаловать в TaskFlow, ${username}!* ✨

Многофункциональная платформа для продвижения и заработка.

🚀 *Что тебя ждёт:*

📋 *Биржа заданий* — зарабатывай токены на простых действиях
🤖 *AI инструменты* — генерация постов, идей, сценариев
💼 *Фриланс* — заказы на дизайн, монтаж, разработку
📊 *Аналитика* — статистика каналов и аудитории

🎯 *Выбери раздел в меню ниже!*`;

        await sendMessage(chatId, welcomeText, mainMenu);
        res.sendStatus(200);
        return;
    }

    res.sendStatus(200);
});

// Обработка нажатий на кнопки
app.post('/webhook/callback', async (req, res) => {
    const callback = req.body.callback_query;
    if (!callback) {
        res.sendStatus(200);
        return;
    }

    const chatId = callback.message.chat.id;
    const data = callback.data;

    switch(data) {
        // Главные разделы
        case 'tasks':
            await sendMessage(chatId,
`📋 *Биржа заданий*

💡 *Что это:* Выполняй простые задания (подписки, лайки, репосты) и получай токены.

✅ *Как работает:*
1. Выбери задание на сайте
2. Выполни действие
3. Получи токены на баланс

🚀 *Перейти к заданиям:* ${SITE_URL}/tasks`);
            break;

        case 'ai':
            await sendMessage(chatId,
`🤖 *AI инструменты*

Доступные инструменты:

📝 *Генератор постов* — тексты для соцсетей
🎨 *Генератор идей* — темы для контента
📹 *Сценарии для видео* — готовые планы
🔍 *SEO анализ* — оптимизация контента

🔮 *Выбери инструмент в меню ниже*`, aiMenu);
            break;

        case 'freelance':
            await sendMessage(chatId,
`💼 *Фриланс-биржа*

Категории заказов:

✏️ *Дизайн* — логотипы, баннеры, презентации
🎬 *Монтаж* — видео, рилсы, клипы
📝 *Копирайтинг* — тексты, статьи, описания
💻 *Разработка* — сайты, боты, скрипты

🔧 *Выбери категорию*`, freelanceMenu);
            break;

        case 'analytics':
            await sendMessage(chatId,
`📊 *Аналитика*

⚡ *Скоро будет доступно:*

• 📈 Статистика просмотров канала
• 👥 Анализ аудитории
• 🔥 Тренды и рекомендации
• 📊 Конкурентный анализ

*Токенами!* Следите за обновлениями.`);
            break;

        case 'profile':
            await sendMessage(chatId,
`👤 *Мой профиль*

🔗 *Привяжи аккаунт на сайте:* ${SITE_URL}/profile

После привязки ты сможешь:
• 💰 Следить за балансом
• 📊 Видеть статистику
• 🎁 Получать бонусы
• 🏆 Отслеживать достижения`);
            break;

        case 'balance':
            await sendMessage(chatId,
`💰 *Твой баланс*

👤 У тебя пока нет привязанного аккаунта.

🔗 *Привяжи аккаунт:* ${SITE_URL}/profile

⚡ *Как заработать токены:*
• Выполняй задания в бирже
• Создавай свои задания
• Приглашай друзей
• Участвуй в конкурсах`);
            break;

        case 'help':
            await sendMessage(chatId,
`🆘 *Помощь*

📌 *Основные команды:*
/start — Главное меню
/balance — Мой баланс
/tasks — Биржа заданий
/ai — AI инструменты
/freelance — Фриланс
/profile — Профиль

🔗 *Сайт:* ${SITE_URL}
📧 *Поддержка:* @aquozales

❓ *FAQ:*
• Как заработать токены? → Задания в бирже
• Где потратить токены? → Создание заданий, AI инструменты
• Как вывести? → Скоро появится`);
            break;

        // AI подменю
        case 'ai_post':
            await sendMessage(chatId,
`📝 *Генератор постов*

🎯 *Выбери тему поста:*

• Продукт/услуга
• Личный бренд
• Развлекательный
• Обучающий

👉 *Перейди на сайт:* ${SITE_URL}/ai/post`);
            break;

        case 'ai_ideas':
            await sendMessage(chatId,
`🎨 *Генератор идей*

💡 *Идеи для контента:*

• 10 идей для TikTok за 5 минут
• Тренды этой недели
• Как залететь в рекомендации

👉 *Попробовать:* ${SITE_URL}/ai/ideas`);
            break;

        case 'ai_script':
            await sendMessage(chatId,
`📹 *Сценарии для видео*

🎬 *Готовые шаблоны:*

• Распаковка продукта (60 сек)
• Обзор услуги (30 сек)
• Обучение (90 сек)

👉 *Создать сценарий:* ${SITE_URL}/ai/script`);
            break;

        case 'ai_seo':
            await sendMessage(chatId,
`🔍 *SEO анализ*

📊 *Анализируй свои посты:*

• Оптимизация заголовков
• Ключевые слова
• Вовлеченность

👉 *Проверить пост:* ${SITE_URL}/ai/seo`);
            break;

        // Фриланс подменю
        case 'freelance_design':
            await sendMessage(chatId,
`✏️ *Заказы на дизайн*

💎 *Популярные услуги:*

• Логотип — от 100 токенов
• Баннер — от 50 токенов
• Презентация — от 200 токенов

👉 *Создать заказ:* ${SITE_URL}/freelance/design`);
            break;

        case 'freelance_video':
            await sendMessage(chatId,
`🎬 *Заказы на монтаж*

✨ *Примеры цен:*

• Риелс (до 60 сек) — от 150 токенов
• Клип (3 мин) — от 300 токенов
• Обработка видео — от 50 токенов

👉 *Разместить заказ:* ${SITE_URL}/freelance/video`);
            break;

        case 'freelance_copy':
            await sendMessage(chatId,
`📝 *Копирайтинг*

✍️ *Цены:*

• Пост для соцсетей — от 30 токенов
• Статья (1000 знаков) — от 50 токенов
• Слоган — от 20 токенов

👉 *Создать заказ:* ${SITE_URL}/freelance/copy`);
            break;

        case 'freelance_dev':
            await sendMessage(chatId,
`💻 *Разработка*

⚙️ *Услуги:*

• Telegram бот — от 500 токенов
• Сайт-визитка — от 1000 токенов
• Скрипты — от 200 токенов

👉 *Заказать разработку:* ${SITE_URL}/freelance/dev`);
            break;

        // Навигация
        case 'back_main':
            await sendMessage(chatId, `✨ *Главное меню TaskFlow* ✨\n\nВыбери раздел:`, mainMenu);
            break;

        default:
            await sendMessage(chatId, '⚠️ Неизвестная команда. Используй /start', mainMenu);
    }

    // Отвечаем на callback
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: callback.id })
    });

    res.sendStatus(200);
});

// Функция отправки сообщения
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
