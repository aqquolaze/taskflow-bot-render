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

// Состояния игр (для хранения загаданных чисел)
const gameStates = new Map();

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

    // Обработка обычных сообщений (для игры "Угадай число")
    if (gameStates.has(chatId) && !text.startsWith('/')) {
        const game = gameStates.get(chatId);
        if (game.type === 'number') {
            const guess = parseInt(text);
            if (isNaN(guess)) {
                await sendMessage(chatId, '🔢 Введи число!');
                res.sendStatus(200);
                return;
            }
            
            if (guess === game.number) {
                gameStates.delete(chatId);
                await sendMessage(chatId, `🎉 *Поздравляю!* Ты угадал число ${game.number}! 🎉\n\nПопробуй другие игры: /start`, gamesMenu);
            } else if (guess < game.number) {
                await sendMessage(chatId, `📈 Моё число *больше* чем ${guess}. Попробуй ещё!`);
            } else {
                await sendMessage(chatId, `📉 Моё число *меньше* чем ${guess}. Попробуй ещё!`);
            }
            res.sendStatus(200);
            return;
        }
    }

    if (text === '/start') {
        const welcomeText = 
`✨ *Добро пожаловать в TaskFlow, ${username}!* ✨

💎 *Всё самое интересное на сайте:* ${SITE_URL}

🎮 *А здесь ты можешь поиграть в мини-игры и выиграть бонусы!*

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
        case 'back_main':
            await sendMessage(chatId, '✨ *Главное меню TaskFlow* ✨', mainMenu);
            break;

        case 'profile':
            await sendMessage(chatId,
`👤 *Профиль*

🔗 *Привяжи аккаунт и управляй профилем на сайте:*

${SITE_URL}/profile

📊 *После привязки ты увидишь:*
• Баланс токенов
• Историю операций
• Статистику`);
            break;

        case 'tokens':
            await sendMessage(chatId,
`💰 *Токены*

💎 *Внутренняя валюта платформы*

🎁 *Как получить:*
• Бонус за регистрацию
• Конкурсы и розыгрыши
• Приглашение друзей
• Акции

📋 *На что тратить:*
• Создание заданий
• AI инструменты
• Быстрые услуги

👉 *Управлять балансом:* ${SITE_URL}/tokens`);
            break;

        case 'contests':
            await sendMessage(chatId,
`🎁 *Конкурсы и розыгрыши*

🔥 *Актуальные конкурсы:*

• *Ежедневный бонус* — заходи на сайт и получай токены
• *Конкурс активности* — топ-10 в конце месяца
• *Розыгрыши* — следи за анонсами

👉 *Участвовать:* ${SITE_URL}/contests

🎯 *А пока можешь поиграть в мини-игры!*`);
            break;

        case 'help':
            await sendMessage(chatId,
`🆘 *Помощь*

📌 *О боте:*

🌐 *Сайт:* ${SITE_URL}
🎮 *Игры:* Кости, дартс, футбол, баскетбол, угадай число, камень-ножницы

📧 *Поддержка:* @aquozales

🎁 *Бонусы и конкурсы:* Следи за анонсами в канале!

👇 *Используй меню для навигации*`);
            break;

        // === МИНИ-ИГРЫ ===
        case 'games':
            await sendMessage(chatId, '🎮 *Выбери игру:*', gamesMenu);
            break;

        case 'game_dice':
            const diceValue = Math.floor(Math.random() * 6) + 1;
            const diceEmojis = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
            await sendMessage(chatId, `🎲 *Ты выбросил ${diceValue}* ${diceEmojis[diceValue]}\n\nПопробуй ещё раз!`);
            break;

        case 'game_darts':
            const dartsValue = Math.floor(Math.random() * 7) + 1;
            const dartsMessages = ['Мимо!', '1 очко', '2 очка', '3 очка', '4 очка', '5 очков', '🎯 ЯБЛОЧКО! 6 очков!'];
            await sendMessage(chatId, `🎯 *Дартс*\n\n${dartsMessages[dartsValue]}`);
            break;

        case 'game_football':
            const footballResult = Math.floor(Math.random() * 4);
            const footballMessages = ['🥅 ГОЛ! Ты забил!', '🧤 Вратарь поймал мяч', '📐 Удар в штангу', '🌪️ Удар мимо ворот'];
            await sendMessage(chatId, `⚽ *Футбол*\n\n${footballMessages[footballResult]}`);
            break;

        case 'game_basketball':
            const basketballResult = Math.floor(Math.random() * 4);
            const basketballMessages = ['🏀 Трёхочковый! Свиш!', '🧱 Удар в кольцо — мимо', '📐 Бросок со штрафной — точно!', '💥 Блок-шот! Не залетело'];
            await sendMessage(chatId, `🏀 *Баскетбол*\n\n${basketballMessages[basketballResult]}`);
            break;

        case 'game_number':
            const secretNumber = Math.floor(Math.random() * 100) + 1;
            gameStates.set(chatId, { type: 'number', number: secretNumber });
            await sendMessage(chatId, `🎲 *Угадай число*

Я загадал число от 1 до 100.

🔢 Введи своё предположение в чат!`);
            break;

        case 'game_rps':
            const choices = ['✊ Камень', '✋ Бумага', '✌️ Ножницы'];
            const botChoice = Math.floor(Math.random() * 3);
            
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
            
            await sendMessage(chatId, `✂️ *Камень-ножницы-бумага*

Выбери свой вариант:`, rpsMenu);
            break;

        // === ЛОГИКА КАМЕНЬ-НОЖНИЦЫ ===
        case 'rps_rock':
            const botRock = Math.floor(Math.random() * 3);
            const resultRock = getRPSResult(0, botRock);
            await sendMessage(chatId, `${resultRock}`);
            break;

        case 'rps_paper':
            const botPaper = Math.floor(Math.random() * 3);
            const resultPaper = getRPSResult(1, botPaper);
            await sendMessage(chatId, `${resultPaper}`);
            break;

        case 'rps_scissors':
            const botScissors = Math.floor(Math.random() * 3);
            const resultScissors = getRPSResult(2, botScissors);
            await sendMessage(chatId, `${resultScissors}`);
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

function getRPSResult(player, bot) {
    const choices = ['✊ Камень', '✋ Бумага', '✌️ Ножницы'];
    const playerChoice = choices[player];
    const botChoice = choices[bot];
    
    if (player === bot) {
        return `✂️ *Камень-ножницы-бумага*

Ты выбрал: ${playerChoice}
Бот выбрал: ${botChoice}

🤝 *Ничья!* Попробуй ещё раз!`;
    }
    
    if ((player === 0 && bot === 2) || (player === 1 && bot === 0) || (player === 2 && bot === 1)) {
        return `✂️ *Камень-ножницы-бумага*

Ты выбрал: ${playerChoice}
Бот выбрал: ${botChoice}

🎉 *Ты победил!* 🎉`;
    }
    
    return `✂️ *Камень-ножницы-бумага*

Ты выбрал: ${playerChoice}
Бот выбрал: ${botChoice}

😔 *Бот победил!* Попробуй ещё раз!`;
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
