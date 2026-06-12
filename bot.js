import express from 'express';
const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;

// Проверка, что бот жив
app.get('/', (req, res) => {
    res.send('Бот TaskFlow работает на Render!');
});

// ВЕБХУК — сюда Telegram присылает обновления
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
        console.error('Ошибка в вебхуке:', error);
        res.status(500).send('Internal Server Error');
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`✅ Бот запущен на порту ${port}`);
    console.log(`📡 Вебхук доступен по адресу: https://taskflow-telegram-bot.onrender.com/webhook`);
});
