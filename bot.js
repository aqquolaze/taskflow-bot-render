import express from 'express';
const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const SITE_URL = 'https://gotaskflow.ru';

// Главное меню
const mainMenu = {
    inline_keyboard: [
        [
            { text: '🌐 Открыть сайт', url: SITE_URL }
        ],
        [
            { text: '👤 Профиль', callback_data: 'profile' },
            { text: '💰 Токены', callback_data: 'tokens' }
        ],
        [
            { text: '🎮 Мини-игры', callback_data: 'games' },
            { text: '🎁 Конкурсы', callback_data: 'contests' }
        ],
        [
            { text: '📋 О проекте', callback_data: 'about' },
            { text: '❓ Помощь', callback_data: 'help' }
        ]
    ]
};

// Меню мини-игр
const gamesMenu = {
    inline_keyboard: [
        [
            { text: '🎲 Кости', callback_data: 'game_dice' },
            { text: '🎯 Дартс', callback_data: 'game_darts' }
        ],
        [
            { text: '⚽ Футбол', callback_data: 'game_football' },
            { text: '🏀 Баскетбол', callback_data: 'game_basketball' }
        ],
        [
            { text: '🎰 Угадай число', callback_data: 'game_number' },
            { text: '✂️ Камень-ножницы', callback_data: 'game_rps' }
        ],
        [
            { text: '⬅️ Назад', callback_data: 'back_main' }
        ]
    ]
};

// Состояния игр
const gameStates = new Map();

app.get('/', (req, res) => {
    res.send('🤖 TaskFlow Bot работает!');
});

// Функция редактирования сообщения (меняет текст и кнопки)
async function editMessage(chatId, messageId, text, replyMarkup = null) {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`;
    const body = {
        chat_id: chatId,
        message_id: messageId,
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

// Функция отправки нового сообщения
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
    
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    return await response.json();
}

app.post('/webhook', async (req, res) => {
    const update = req.body;
    
    // Обработка обычных сообщений
    if (update.message) {
        const message = update.message;
        const chatId = message.chat.id;
        const text = message.text || '';
        const username = message.from?.first_name || 'друг';
        const messageId = message.message_id;

        // Обработка игры "Угадай число"
        if (gameStates.has(chatId) && !text.startsWith('/')) {
            const game = gameStates.get(chatId);
            if (game.type === 'number') {
                const guess = parseInt(text);
                if (isNaN(guess)) {
                    await editMessage(chatId, messageId, '🔢 Введи число от 1 до 100');
                    res.sendStatus(200);
                    return;
                }
                
                if (guess === game.number) {
                    gameStates.delete(chatId);
                    await editMessage(chatId, messageId, `🎉 Поздравляю! Ты угадал число ${game.number}!`, gamesMenu);
                } else if (guess < game.number) {
                    await editMessage(chatId, messageId, `📈 Моё число БОЛЬШЕ чем ${guess}. Попробуй ещё!`);
                } else {
                    await editMessage(chatId, messageId, `📉 Моё число МЕНЬШЕ чем ${guess}. Попробуй ещё!`);
                }
                res.sendStatus(200);
                return;
            }
        }

        if (text === '/start') {
            const welcomeText = 
`✨ *Добро пожаловать в TaskFlow, ${username}!* ✨

💎 *Что такое TaskFlow?*

Платформа для продвижения проектов и использования AI инструментов за внутренние токены.

━━━━━━━━━━━━━━━━━━━━━━

🚀 *Что доступно на сайте:*

📋 *Биржа заданий* — создавай задания для продвижения
🤖 *AI инструменты* — генерация постов, идей, SEO
⚡ *Быстрые услуги* — лайки, подписки, комментарии

━━━━━━━━━━━━━━━━━━━━━━

👇 *Выбери действие в меню*`;

            await sendMessage(chatId, welcomeText, mainMenu);
            res.sendStatus(200);
            return;
        }
    }
    
    // Обработка нажатий на кнопки (callback_query) — ЗДЕСЬ РЕДАКТИРУЕМ СООБЩЕНИЕ
    if (update.callback_query) {
        const callback = update.callback_query;
        const chatId = callback.message.chat.id;
        const messageId = callback.message.message_id;
        const data = callback.data;
        
        console.log(`Нажата кнопка: ${data} от пользователя ${chatId}`);
        
        switch(data) {
            case 'back_main':
                await editMessage(chatId, messageId, '✨ *Главное меню TaskFlow* ✨', mainMenu);
                break;
            case 'about':
                await editMessage(chatId, messageId, 
`📋 *О ПРОЕКТЕ TASKFLOW*

💎 Платформа для продвижения проектов и использования AI инструментов.

🚀 *Возможности:*
• Биржа заданий
• AI инструменты
• Быстрые услуги
• Токены

🔗 *Сайт:* ${SITE_URL}`, mainMenu);
                break;
            case 'profile':
                await editMessage(chatId, messageId, 
`👤 *ПРОФИЛЬ*

🔗 *Привяжи аккаунт на сайте:* ${SITE_URL}/profile

📊 *После привязки ты увидишь:*
• Баланс токенов
• Историю операций
• Статистику заданий

🎁 *Бонус за регистрацию:* 100 токенов!`, mainMenu);
                break;
            case 'tokens':
                await editMessage(chatId, messageId, 
`💰 *ТОКЕНЫ*

💎 Внутренняя валюта платформы.

🎁 *Как получить:*
• Бонус за регистрацию (100)
• Приглашение друзей (+50)
• Ежедневный бонус
• Конкурсы

👉 ${SITE_URL}/tokens`, mainMenu);
                break;
            case 'contests':
                await editMessage(chatId, messageId, 
`🎁 *КОНКУРСЫ*

• Ежедневный бонус
• Пригласи друга (+50 токенов)
• Конкурс активности
• Розыгрыши

👉 ${SITE_URL}/contests`, mainMenu);
                break;
            case 'help':
                await editMessage(chatId, messageId, 
`🆘 *ПОМОЩЬ*

🌐 *Сайт:* ${SITE_URL}
🎮 *Игры:* Кости, дартс, футбол, баскетбол, угадай число, камень-ножницы

👇 Используй меню для навигации`, mainMenu);
                break;
            case 'games':
                await editMessage(chatId, messageId, '🎮 *Выбери игру:*', gamesMenu);
                break;
            case 'game_dice':
                const diceValue = Math.floor(Math.random() * 6) + 1;
                const diceEmojis = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
                await editMessage(chatId, messageId, `🎲 *Результат:* ${diceValue} ${diceEmojis[diceValue]}`, gamesMenu);
                break;
            case 'game_darts':
                const dartsValue = Math.floor(Math.random() * 7) + 1;
                const dartsMessages = ['Мимо', '1 очко', '2 очка', '3 очка', '4 очка', '5 очков', '🏆 ЯБЛОЧКО! 6 очков'];
                await editMessage(chatId, messageId, `🎯 *Результат:* ${dartsMessages[dartsValue]}`, gamesMenu);
                break;
            case 'game_football':
                const footballResult = Math.floor(Math.random() * 4);
                const footballMessages = ['🥅 ГОЛ! Ты забил!', '🧤 Вратарь поймал мяч', '📐 Удар в штангу', '🌪️ Мимо ворот'];
                await editMessage(chatId, messageId, `⚽ *Результат:* ${footballMessages[footballResult]}`, gamesMenu);
                break;
            case 'game_basketball':
                const basketballResult = Math.floor(Math.random() * 4);
                const basketballMessages = ['🏀 Трёхочковый!', '🧱 Мимо кольца', '🎯 Точно в цель!', '💥 Блок-шот'];
                await editMessage(chatId, messageId, `🏀 *Результат:* ${basketballMessages[basketballResult]}`, gamesMenu);
                break;
            case 'game_number':
                const secretNumber = Math.floor(Math.random() * 100) + 1;
                gameStates.set(chatId, { type: 'number', number: secretNumber });
                await editMessage(chatId, messageId, '🎲 *Угадай число*\n\nЯ загадал число от 1 до 100. Введи свой вариант!', gamesMenu);
                break;
            case 'game_rps':
                const rpsMenu = {
                    inline_keyboard: [
                        [
                            { text: '✊ Камень', callback_data: 'rps_rock' },
                            { text: '✋ Бумага', callback_data: 'rps_paper' },
                            { text: '✌️ Ножницы', callback_data: 'rps_scissors' }
                        ],
                        [
                            { text: '⬅️ Назад', callback_data: 'games' }
                        ]
                    ]
                };
                await editMessage(chatId, messageId, '✂️ *Камень-ножницы-бумага*\n\nВыбери свой вариант:', rpsMenu);
                break;
            case 'rps_rock':
                const botRock = Math.floor(Math.random() * 3);
                await editMessage(chatId, messageId, getRPSResult(0, botRock), gamesMenu);
                break;
            case 'rps_paper':
                const botPaper = Math.floor(Math.random() * 3);
                await editMessage(chatId, messageId, getRPSResult(1, botPaper), gamesMenu);
                break;
            case 'rps_scissors':
                const botScissors = Math.floor(Math.random() * 3);
                await editMessage(chatId, messageId, getRPSResult(2, botScissors), gamesMenu);
                break;
            default:
                await editMessage(chatId, messageId, '⚠️ Неизвестная команда', mainMenu);
        }
        
        // Обязательно отвечаем на callback
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ callback_query_id: callback.id })
        });
        
        res.sendStatus(200);
        return;
    }
    
    res.sendStatus(200);
});

function getRPSResult(player, bot) {
    const choices = ['✊ Камень', '✋ Бумага', '✌️ Ножницы'];
    const playerChoice = choices[player];
    const botChoice = choices[bot];
    
    if (player === bot) {
        return `✂️ *Ничья!*\n\nТы: ${playerChoice}\nБот: ${botChoice}`;
    }
    if ((player === 0 && bot === 2) || (player === 1 && bot === 0) || (player === 2 && bot === 1)) {
        return `🎉 *Ты победил!* 🎉\n\nТы: ${playerChoice}\nБот: ${botChoice}`;
    }
    return `😔 *Бот победил!*\n\nТы: ${playerChoice}\nБот: ${botChoice}`;
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`🤖 TaskFlow Bot запущен на порту ${port}`);
});
