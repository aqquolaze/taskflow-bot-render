import express from 'express';
const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;

// Простой ответ на GET (чтобы браузер не ругался)
app.get('/webhook', (req, res) => {
    res.status(200).send('Webhook is ready. Use POST method.');
});

// ОСНОВНОЙ обработчик для Telegram (POST)
app.post('/webhook', async (req, res) => {
    try {
        const message = req.body.message;
        if (message && message.text === '/start') {
            const chatId = message.chat.id;
            const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
            await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: '✅ Бот TaskFlow работает!\n\nСайт: https://gotaskflow.ru'
                })
            });
        }
        res.status(200).send('OK');
    } catch (error) {
        console.error('Ошибка:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Корневой маршрут для проверки
app.get('/', (req, res) => {
    res.send('Бот TaskFlow работает на Render!');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`✅ Бот запущен на порту ${port}`);
    console.log(`📡 Вебхук доступен: https://taskflow-telegram-bot.onrender.com/webhook`);
});
