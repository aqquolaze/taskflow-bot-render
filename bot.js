import express from 'express';
const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;

// Сайт TaskFlow
const SITE_URL = 'https://gotaskflow.ru';

// Эмодзи для команд
const emoji = {
    site: '🌐',
    balance: '💰',
    tasks: '📋',
    profile: '👤',
    help: '🆘',
    tasks_inline: '📋'
};

app.get('/', (req, res) => {
    res.send('🤖 Бот TaskFlow работает!');
});

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

    // Главное меню
    if (text === '/start') {
        const welcomeText = 
`🎉 *Добро пожаловать в TaskFlow, ${username}!* 🎉

Здесь ты можешь:
• 📋 *Выполнять задания* — зарабатывай токены
• 💰 *Создавать задания* — продвигай свой канал
• 👤 *Следить за балансом* — прямо в боте

🚀 *Начни прямо сейчас!*`;

        const keyboard = {
            inline_keyboard: [
                [
                    { text: '🌐 Открыть сайт', url: SITE_URL },
                    { text: '💰 Мой баланс', callback_data: 'balance' }
                ],
                [
                    { text: '📋 Доступные задания', callback_data: 'tasks' },
                    { text: '👤 Мой профиль', callback_data: 'profile' }
                ],
                [
                    { text: '❓ Помощь', callback_data: 'help' }
                ]
            ]
        };

        await sendMessage(chatId, welcomeText, keyboard);
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

    // Обработка разных кнопок
    switch(data) {
        case 'balance':
            await sendMessage(chatId, 
`💰 *Твой баланс*

👤 ${callback.from.first_name}, у тебя пока нет привязанного аккаунта.

🔗 *Привяжи аккаунт на сайте:*
${SITE_URL}/profile

После привязки баланс будет отображаться здесь автоматически.`);
            break;

        case 'tasks':
            await sendMessage(chatId,
`📋 *Доступные задания*

➡️ Перейди на сайт, чтобы увидеть все активные задания:

${SITE_URL}/tasks

💡 *Совет:* Чем больше заданий выполнишь — тем больше токенов заработаешь!`);
            break;

        case 'profile':
            await sendMessage(chatId,
`👤 *Мой профиль*

Привяжи аккаунт на сайте, чтобы:
• 💰 Следить за балансом
• 📊 Видеть статистику
• 🎁 Получать бонусы

👉 ${SITE_URL}/profile`);
            break;

        case 'help':
            await sendMessage(chatId,
`🆘 *Помощь*

📌 *Основные команды:*
/start — Главное меню
/balance — Мой баланс
/tasks — Задания
/profile — Профиль

🔗 *Сайт:* ${SITE_URL}

📧 *Поддержка:* @aquozales

❓ *Вопросы и предложения* пиши в поддержку.`);
            break;

        default:
            await sendMessage(chatId, '⚠️ Неизвестная команда. Используй /start');
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
    console.log(`🤖 Бот TaskFlow запущен на порту ${port}`);
});
