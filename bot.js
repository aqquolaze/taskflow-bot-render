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

// Главный обработчик вебхука
app.post('/webhook', async (req, res) => {
    const update = req.body;
    
    // Обработка обычных сообщений
    if (update.message) {
        const message = update.message;
        const chatId = message.chat.id;
        const text = message.text || '';
        const username = message.from?.first_name || 'друг';

        // Обработка игры "Угадай число"
        if (gameStates.has(chatId) && !text.startsWith('/')) {
            const game = gameStates.get(chatId);
            if (game.type === 'number') {
                const guess = parseInt(text);
                if (isNaN(guess)) {
                    await sendMessage(chatId, '🔢 Введи число от 1 до 100');
                    res.sendStatus(200);
                    return;
                }
                
                if (guess === game.number) {
                    gameStates.delete(chatId);
                    await sendMessage(chatId, `🎉 Поздравляю! Ты угадал число ${game.number}!`, gamesMenu);
                } else if (guess < game.number) {
                    await sendMessage(chatId, `📈 Моё число БОЛЬШЕ чем ${guess}. Попробуй ещё!`);
                } else {
                    await sendMessage(chatId, `📉 Моё число МЕНЬШЕ чем ${guess}. Попробуй ещё!`);
                }
                res.sendStatus(200);
                return;
            }
        }

        if (text === '/start') {
            await sendMessage(chatId, 
`✨ *Добро пожаловать в TaskFlow, ${username}!* ✨

💎 *Что такое TaskFlow?*

Платформа для продвижения проектов и использования AI инструментов за внутренние токены.

━━━━━━━━━━━━━━━━━━━━━━

🚀 *Что доступно на сайте:*

📋 *Биржа заданий* — создавай задания для продвижения
🤖 *AI инструменты* — генерация постов, идей, SEO
⚡ *Быстрые услуги* — лайки, подписки, комментарии

━━━━━━━━━━━━━━━━━━━━━━

👇 *Выбери действие в меню*`, mainMenu);
            res.sendStatus(200);
            return;
        }
    }
    
    // Обработка нажатий на кнопки (callback_query)
    if (update.callback_query) {
        const callback = update.callback_query;
        const chatId = callback.message.chat.id;
        const data = callback.data;
        
        console.log(`Нажата кнопка: ${data} от пользователя ${chatId}`);
        
        switch(data) {
            case 'back_main':
                await sendMessage(chatId, '✨ *Главное меню TaskFlow* ✨', mainMenu);
                break;
            case 'about':
                await sendMessage(chatId, 
`📋 *О ПРОЕКТЕ TASKFLOW*

💎 Платформа для продвижения проектов и использования AI инструментов.

🚀 *Возможности:*
• Биржа заданий
• AI инструменты
• Быстрые услуги
• Токены

🔗 *Сайт:* ${SITE_URL}
📧 *Поддержка:* @aquozales`);
                break;
            case 'profile':
                await sendMessage(chatId, 
`👤 *ПРОФИЛЬ*

🔗 *Привяжи аккаунт на сайте:* ${SITE_URL}/profile

📊 *После привязки ты увидишь:*
• Баланс токенов
• Историю операций
• Статистику заданий

🎁 *Бонус за регистрацию:* 100 токенов!`);
                break;
            case 'tokens':
                await sendMessage(chatId, 
`💰 *ТОКЕНЫ*

💎 Внутренняя валюта платформы.

🎁 *Как получить:*
• Бонус за регистрацию (100)
• Приглашение друзей (+50)
• Ежедневный бонус
• Конкурсы

👉 ${SITE_URL}/tokens`);
                break;
            case 'contests':
                await sendMessage(chatId, 
`🎁 *КОНКУРСЫ*

• Ежедневный бонус
• Пригласи друга (+50 токенов)
• Конкурс активности
• Розыгрыши

👉 ${SITE_URL}/contests`);
                break;
            case 'help':
                await sendMessage(chatId, 
`🆘 *ПОМОЩЬ*

🌐 *Сайт:* ${SITE_URL}
🎮 *Игры:* Кости, дартс, футбол, баскетбол, угадай число, камень-ножницы
📧 *Поддержка:* @aquozales

👇 Используй меню для навигации`);
                break;
            case 'games':
                await sendMessage(chatId, '🎮 *Выбери игру:*', gamesMenu);
                break;
            case 'game_dice':
                const diceValue = Math.floor(Math.random() * 6) + 1;
                const diceEmojis = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
                await sendMessage(chatId, `🎲 *Кости*: ${diceValue} ${diceEmojis[diceValue]}`);
                break;
            case 'game_darts':
                const dartsValue = Math.floor(Math.random() * 7) + 1;
                const dartsMessages = ['Мимо', '1 очко', '2 очка', '3 очка', '4 очка', '5 очков', 'ЯБЛОЧКО! 6 очков'];
                await sendMessage(chatId, `🎯 *Дартс*: ${dartsMessages[dartsValue]}`);
                break;
            case 'game_football':
                const footballResult = Math.floor(Math.random() * 4);
                const footballMessages = ['ГОЛ! Ты забил!', 'Вратарь поймал мяч', 'Удар в штангу', 'Мимо ворот'];
                await sendMessage(chatId, `⚽ *Футбол*: ${footballMessages[footballResult]}`);
                break;
            case 'game_basketball':
                const basketballResult = Math.floor(Math.random() * 4);
                const basketballMessages = ['Трёхочковый!', 'Мимо кольца', 'Точно в цель!', 'Блок-шот'];
                await sendMessage(chatId, `🏀 *Баскетбол*: ${basketballMessages[basketballResult]}`);
                break;
            case 'game_number':
                const secretNumber = Math.floor(Math.random() * 100) + 1;
                gameStates.set(chatId, { type: 'number', number: secretNumber });
                await sendMessage(chatId, '🎲 *Угадай число*\n\nЯ загадал число от 1 до 100. Введи свой вариант!');
                break;
            case 'game_rps':
                const rpsMenu = {
                    inline_keyboard: [
                        [{ text: '✊ Камень', callback_data: 'rps_rock' }],
                        [{ text: '✋ Бумага', callback_data: 'rps_paper' }],
                        [{ text: '✌️ Ножницы', callback_data: 'rps_scissors' }],
                        [{ text: '⬅️ Назад', callback_data: 'games' }]
                    ]
                };
                await sendMessage(chatId, '✂️ *Камень-ножницы-бумага*\n\nВыбери свой вариант:', rpsMenu);
                break;
            case 'rps_rock':
                const botRock = Math.floor(Math.random() * 3);
                await sendMessage(chatId, getRPSResult(0, botRock));
                break;
            case 'rps_paper':
                const botPaper = Math.floor(Math.random() * 3);
                await sendMessage(chatId, getRPSResult(1, botPaper));
                break;
            case 'rps_scissors':
                const botScissors = Math.floor(Math.random() * 3);
                await sendMessage(chatId, getRPSResult(2, botScissors));
                break;
            default:
                await sendMessage(chatId, '⚠️ Неизвестная команда');
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
