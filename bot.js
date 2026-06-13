import express from 'express';
const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const SITE_URL = 'https://gotaskflow.ru';
const SUPABASE_URL = 'https://woqnhepaqbgzilboaydp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_hX1v_iYn2mzGhNyEkaCtzg_LwrzgI8Q';

// Главное меню
const mainMenu = {
    inline_keyboard: [
        [
            { text: '🌐 Открыть сайт', url: SITE_URL }
        ],
        [
            { text: '👤 Профиль', callback_data: 'profile' },
            { text: '💰 Баланс', callback_data: 'balance' }
        ],
        [
            { text: '🎮 Игры на токены', callback_data: 'games' },
            { text: '🎁 Конкурсы', callback_data: 'contests' }
        ],
        [
            { text: '📋 О проекте', callback_data: 'about' },
            { text: '🔗 Привязать аккаунт', callback_data: 'link_account' }
        ]
    ]
};

// Меню игр
const gamesMenu = {
    inline_keyboard: [
        [
            { text: '🎲 Кости (x2)', callback_data: 'game_dice' },
            { text: '🎯 Дартс (x3)', callback_data: 'game_darts' }
        ],
        [
            { text: '⚽ Футбол (x2.5)', callback_data: 'game_football' },
            { text: '🏀 Баскетбол (x2)', callback_data: 'game_basketball' }
        ],
        [
            { text: '🎰 Угадай число (x5)', callback_data: 'game_number' },
            { text: '✂️ Камень-ножницы (x2)', callback_data: 'game_rps' }
        ],
        [
            { text: '⬅️ Назад', callback_data: 'back_main' }
        ]
    ]
};

// Меню выбора ставки
async function getBetMenu(gameId, gameName, multiplier) {
    return {
        inline_keyboard: [
            [
                { text: '🔹 10 токенов', callback_data: `bet_${gameId}_10` },
                { text: '🔸 50 токенов', callback_data: `bet_${gameId}_50` }
            ],
            [
                { text: '🔹 100 токенов', callback_data: `bet_${gameId}_100` },
                { text: '🔸 500 токенов', callback_data: `bet_${gameId}_500` }
            ],
            [
                { text: '⬅️ Назад', callback_data: 'games' }
            ]
        ]
    };
}

// Состояния игр
const gameStates = new Map();

// Проверка привязки Telegram к сайту
async function checkUserRegistered(telegramId) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?telegram_id=eq.${telegramId}&select=id,balance`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        const data = await response.json();
        if (data && data.length > 0) {
            return { registered: true, userId: data[0].id, balance: data[0].balance };
        }
        return { registered: false };
    } catch (error) {
        console.error('Ошибка проверки регистрации:', error);
        return { registered: false };
    }
}

// Обновление баланса пользователя
async function updateUserBalance(telegramId, newBalance) {
    try {
        await fetch(`${SUPABASE_URL}/rest/v1/profiles?telegram_id=eq.${telegramId}`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ balance: newBalance })
        });
    } catch (error) {
        console.error('Ошибка обновления баланса:', error);
    }
}

app.get('/', (req, res) => {
    res.send('🤖 TaskFlow Bot работает!');
});

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
        if (gameStates.has(chatId)) {
            const game = gameStates.get(chatId);
            if (game.type === 'number_waiting_bet') {
                const bet = parseInt(text);
                if (isNaN(bet) || bet <= 0) {
                    await editMessage(chatId, messageId, '❌ Введи корректное число токенов для ставки!');
                    res.sendStatus(200);
                    return;
                }
                
                const userCheck = await checkUserRegistered(chatId);
                if (!userCheck.registered) {
                    await editMessage(chatId, messageId, '❌ Ты не зарегистрирован!\n\n🔗 Привяжи аккаунт через меню или сайт.', mainMenu);
                    gameStates.delete(chatId);
                    res.sendStatus(200);
                    return;
                }
                
                if (userCheck.balance < bet) {
                    await editMessage(chatId, messageId, `❌ Недостаточно токенов! У тебя ${userCheck.balance}, а ставка ${bet}.`, gamesMenu);
                    gameStates.delete(chatId);
                    res.sendStatus(200);
                    return;
                }
                
                gameStates.set(chatId, { type: 'number_playing', number: game.number, bet: bet });
                await editMessage(chatId, messageId, `🎲 *Угадай число*\n\nЯ загадал число от 1 до 100.\n💰 Твоя ставка: ${bet} токенов\n\n🔢 Введи своё предположение!`);
                res.sendStatus(200);
                return;
            }
            
            if (game.type === 'number_playing') {
                const guess = parseInt(text);
                if (isNaN(guess) || guess < 1 || guess > 100) {
                    await editMessage(chatId, messageId, '🔢 Введи число от 1 до 100!');
                    res.sendStatus(200);
                    return;
                }
                
                const secretNumber = game.number;
                const bet = game.bet;
                
                if (guess === secretNumber) {
                    const winAmount = bet * 5;
                    const userCheck = await checkUserRegistered(chatId);
                    if (userCheck.registered) {
                        const newBalance = userCheck.balance + winAmount;
                        await updateUserBalance(chatId, newBalance);
                        await editMessage(chatId, messageId, `🎉 *ПОЗДРАВЛЯЮ!* 🎉\n\nТы угадал число ${secretNumber}!\n💰 Твой выигрыш: ${winAmount} токенов!\n📊 Новый баланс: ${newBalance} токенов`, gamesMenu);
                    }
                } else {
                    const userCheck = await checkUserRegistered(chatId);
                    if (userCheck.registered) {
                        const newBalance = userCheck.balance - bet;
                        await updateUserBalance(chatId, newBalance);
                        const hint = guess < secretNumber ? 'БОЛЬШЕ' : 'МЕНЬШЕ';
                        await editMessage(chatId, messageId, `❌ *Неправильно!*\n\nЗагаданное число ${hint} чем ${guess}.\n💰 Ты проиграл ${bet} токенов.\n📊 Новый баланс: ${newBalance} токенов`, gamesMenu);
                    }
                }
                gameStates.delete(chatId);
                res.sendStatus(200);
                return;
            }
        }

        if (text === '/start') {
            const welcomeText = 
`✨ *Добро пожаловать в TaskFlow, ${username}!* ✨

💎 *Что такое TaskFlow?*

Платформа для продвижения проектов и использования AI инструментов за внутренние токены.


🚀 *Что доступно на сайте:*

📋 *Биржа заданий* — создавай задания для продвижения
🤖 *AI инструменты* — генерация постов, идей, SEO
⚡ *Быстрые услуги* — лайки, подписки, комментарии


👇 *Выбери действие в меню*`;

            await sendMessage(chatId, welcomeText, mainMenu);
            res.sendStatus(200);
            return;
        }
    }
    
    // Обработка нажатий на кнопки
    if (update.callback_query) {
        const callback = update.callback_query;
        const chatId = callback.message.chat.id;
        const messageId = callback.message.message_id;
        const data = callback.data;
        
        console.log(`Нажата кнопка: ${data} от пользователя ${chatId}`);
        
        // Обработка ставок
        if (data.startsWith('bet_')) {
            const parts = data.split('_');
            const gameId = parts[1];
            const bet = parseInt(parts[2]);
            
            const userCheck = await checkUserRegistered(chatId);
            if (!userCheck.registered) {
                await editMessage(chatId, messageId, '❌ Ты не зарегистрирован!\n\n🔗 Привяжи аккаунт на сайте: ' + SITE_URL + '/profile', mainMenu);
                await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ callback_query_id: callback.id })
                });
                res.sendStatus(200);
                return;
            }
            
            if (userCheck.balance < bet) {
                await editMessage(chatId, messageId, `❌ Недостаточно токенов! У тебя ${userCheck.balance}, а ставка ${bet}.`, gamesMenu);
                await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ callback_query_id: callback.id })
                });
                res.sendStatus(200);
                return;
            }
            
            // Запуск игры в зависимости от gameId
            switch(gameId) {
                case 'dice':
                    const diceResult = Math.floor(Math.random() * 6) + 1;
                    const diceMultiplier = 2;
                    const diceWin = diceResult >= 4 ? bet * diceMultiplier : 0;
                    const diceNewBalance = userCheck.balance - bet + diceWin;
                    await updateUserBalance(chatId, diceNewBalance);
                    const diceEmojis = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
                    await editMessage(chatId, messageId, 
                        `🎲 *Игра в Кости (x${diceMultiplier})*\n\nВыпало: ${diceResult} ${diceEmojis[diceResult]}\n💰 Ставка: ${bet}\n${diceWin > 0 ? `✅ Ты выиграл ${diceWin} токенов!` : `❌ Ты проиграл ${bet} токенов`}\n📊 Новый баланс: ${diceNewBalance}`, gamesMenu);
                    break;
                    
                case 'darts':
                    const dartsResult = Math.floor(Math.random() * 7) + 1;
                    const dartsMultiplier = 3;
                    const dartsWin = dartsResult === 7 ? bet * dartsMultiplier : 0;
                    const dartsNewBalance = userCheck.balance - bet + dartsWin;
                    await updateUserBalance(chatId, dartsNewBalance);
                    const dartsMessages = ['1', '2', '3', '4', '5', '6', '🏆 ЯБЛОЧКО!'];
                    await editMessage(chatId, messageId, 
                        `🎯 *Дартс (x${dartsMultiplier})*\n\nРезультат: ${dartsMessages[dartsResult-1]}\n💰 Ставка: ${bet}\n${dartsWin > 0 ? `✅ Ты выиграл ${dartsWin} токенов!` : `❌ Ты проиграл ${bet} токенов`}\n📊 Новый баланс: ${dartsNewBalance}`, gamesMenu);
                    break;
                    
                case 'football':
                    const footballResult = Math.floor(Math.random() * 4);
                    const footballMultiplier = 2.5;
                    const footballWin = footballResult === 0 ? Math.floor(bet * footballMultiplier) : 0;
                    const footballNewBalance = userCheck.balance - bet + footballWin;
                    await updateUserBalance(chatId, footballNewBalance);
                    const footballMessages = ['🥅 ГОЛ! Ты забил!', '🧤 Вратарь поймал мяч', '📐 Удар в штангу', '🌪️ Мимо ворот'];
                    await editMessage(chatId, messageId, 
                        `⚽ *Футбол (x${footballMultiplier})*\n\n${footballMessages[footballResult]}\n💰 Ставка: ${bet}\n${footballWin > 0 ? `✅ Ты выиграл ${footballWin} токенов!` : `❌ Ты проиграл ${bet} токенов`}\n📊 Новый баланс: ${footballNewBalance}`, gamesMenu);
                    break;
                    
                case 'basketball':
                    const basketballResult = Math.floor(Math.random() * 4);
                    const basketballMultiplier = 2;
                    const basketballWin = basketballResult === 0 ? bet * basketballMultiplier : 0;
                    const basketballNewBalance = userCheck.balance - bet + basketballWin;
                    await updateUserBalance(chatId, basketballNewBalance);
                    const basketballMessages = ['🏀 Трёхочковый!', '🧱 Мимо кольца', '🎯 Точно в цель!', '💥 Блок-шот'];
                    await editMessage(chatId, messageId, 
                        `🏀 *Баскетбол (x${basketballMultiplier})*\n\n${basketballMessages[basketballResult]}\n💰 Ставка: ${bet}\n${basketballWin > 0 ? `✅ Ты выиграл ${basketballWin} токенов!` : `❌ Ты проиграл ${bet} токенов`}\n📊 Новый баланс: ${basketballNewBalance}`, gamesMenu);
                    break;
                    
                case 'number':
                    const secretNumber = Math.floor(Math.random() * 100) + 1;
                    gameStates.set(chatId, { type: 'number_waiting_bet', number: secretNumber });
                    await editMessage(chatId, messageId, 
                        `🎲 *Угадай число (x5)*\n\nВведи сумму ставки (минимум 10 токенов):`, gamesMenu);
                    break;
                    
                case 'rps':
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
                    await editMessage(chatId, messageId, '✂️ *Камень-ножницы-бумага (x2)*\n\nВыбери свой вариант и введи ставку в следующем сообщении:', rpsMenu);
                    break;
            }
            
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ callback_query_id: callback.id })
            });
            res.sendStatus(200);
            return;
        }
        
        // Обработка RPS ставки
        if (data === 'rps_rock' || data === 'rps_paper' || data === 'rps_scissors') {
            gameStates.set(chatId, { type: 'rps_waiting_bet', choice: data });
            await editMessage(chatId, messageId, `✂️ *Камень-ножницы-бумага (x2)*\n\nВведи сумму ставки (минимум 10 токенов):`, gamesMenu);
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ callback_query_id: callback.id })
            });
            res.sendStatus(200);
            return;
        }
        
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
                const userCheck = await checkUserRegistered(chatId);
                if (userCheck.registered) {
                    await editMessage(chatId, messageId, 
`👤 *ПРОФИЛЬ*

✅ Аккаунт привязан!

💰 Баланс: ${userCheck.balance} токенов
🆔 ID: ${userCheck.userId}

🔗 ${SITE_URL}/profile`, mainMenu);
                } else {
                    await editMessage(chatId, messageId, 
`👤 *ПРОФИЛЬ*

❌ Аккаунт не привязан!

🔗 *Привяжи аккаунт на сайте:* ${SITE_URL}/profile

После привязки ты сможешь играть на токены и видеть свой баланс.`, mainMenu);
                }
                break;
            case 'balance':
                const balanceCheck = await checkUserRegistered(chatId);
                if (balanceCheck.registered) {
                    await editMessage(chatId, messageId, 
`💰 *ТОКЕНЫ*

💎 Твой баланс: ${balanceCheck.balance} токенов

🎮 *Играй и выигрывай!*`, mainMenu);
                } else {
                    await editMessage(chatId, messageId, 
`💰 *ТОКЕНЫ*

❌ Аккаунт не привязан!

🔗 *Привяжи аккаунт на сайте:* ${SITE_URL}/profile

После привязки ты сможешь видеть баланс и играть.`, mainMenu);
                }
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
            case 'link_account':
                await editMessage(chatId, messageId, 
`🔗 *ПРИВЯЗКА АККАУНТА*

1. Зайди на сайт: ${SITE_URL}
2. Перейди в Профиль → Привязать Telegram
3. Нажми на кнопку "Привязать"
4. Бот автоматически свяжет аккаунты

✅ После привязки ты сможешь:
• Играть на токены
• Проверять баланс
• Получать уведомления`, mainMenu);
                break;
            case 'games':
                await editMessage(chatId, messageId, 
`🎮 *ИГРЫ НА ТОКЕНЫ*

🎲 Кости (x2) — угадай выпадение
🎯 Дартс (x3) — попади в яблочко
⚽ Футбол (x2.5) — забей гол
🏀 Баскетбол (x2) — трёхочковый
🎰 Угадай число (x5) — угадай число
✂️ Камень-ножницы (x2) — победи бота

⚠️ *Для игры нужен привязанный аккаунт!*

👇 *Выбери игру:*`, gamesMenu);
                break;
            case 'game_dice':
                const diceBetMenu = await getBetMenu('dice', 'Кости', 2);
                await editMessage(chatId, messageId, `🎲 *Кости (x2)*\n\nВыбери ставку:`, diceBetMenu);
                break;
            case 'game_darts':
                const dartsBetMenu = await getBetMenu('darts', 'Дартс', 3);
                await editMessage(chatId, messageId, `🎯 *Дартс (x3)*\n\nВыбери ставку:`, dartsBetMenu);
                break;
            case 'game_football':
                const footballBetMenu = await getBetMenu('football', 'Футбол', 2.5);
                await editMessage(chatId, messageId, `⚽ *Футбол (x2.5)*\n\nВыбери ставку:`, footballBetMenu);
                break;
            case 'game_basketball':
                const basketballBetMenu = await getBetMenu('basketball', 'Баскетбол', 2);
                await editMessage(chatId, messageId, `🏀 *Баскетбол (x2)*\n\nВыбери ставку:`, basketballBetMenu);
                break;
            case 'game_number':
                const numberBetMenu = await getBetMenu('number', 'Угадай число', 5);
                await editMessage(chatId, messageId, `🎰 *Угадай число (x5)*\n\nВыбери ставку:`, numberBetMenu);
                break;
            case 'game_rps':
                const rpsBetMenu = await getBetMenu('rps', 'Камень-ножницы', 2);
                await editMessage(chatId, messageId, `✂️ *Камень-ножницы (x2)*\n\nВыбери ставку:`, rpsBetMenu);
                break;
            default:
                await editMessage(chatId, messageId, '⚠️ Неизвестная команда', mainMenu);
        }
        
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

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`🤖 TaskFlow Bot запущен на порту ${port}`);
});
