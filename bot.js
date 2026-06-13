import express from 'express';
const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const SITE_URL = 'https://gotaskflow.ru';
const SUPABASE_URL = 'https://woqnhepaqbgzilboaydp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_hX1v_iYn2mzGhNyEkaCtzg_LwrzgI8Q';

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ АНИМАЦИЙ ---
async function sendSticker(chatId, stickerId) {
    if (!stickerId || stickerId === 'CAACAgIAAxkBAAEB...') return;
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendSticker`;
    await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, sticker: stickerId })
    }).catch(e => console.log('Sticker error:', e.message));
}
async function sendChatAction(chatId, action = 'typing') {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendChatAction`;
    await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, action: action })
    });
}

// --- ID ВАШИХ АНИМИРОВАННЫХ СТИКЕРОВ (ЗАМЕНИТЕ НА СВОИ) ---
const WIN_STICKER_ID = 'CAACAgIAAxkBAANTaiyw6AdeEoib8mIIPUIOeneagVwAAoVaAAJaf5hLlrBpubdws6M8BA'; // Победный стикер
const LOSE_STICKER_ID = 'CAACAgIAAxkBAANRaiywvZ2eiEbm1qHjn_tUVZSWV4UAAlRQAAKrwZlLBSOXHUbe1Tk8BA'; // Грустный стикер
const GAME_START_STICKER_ID = 'CAACAgIAAxkBAANOaiywBv2V8rC155YeHIRX9ejLYF0AAjdTAAImgJFLtTw-FQrNpb08BA'; // Стартовый стикер

// --- ОСНОВНОЕ МЕНЮ ---
const mainMenu = {
    inline_keyboard: [
        [{ text: '🌐 Открыть сайт', url: SITE_URL }],
        [{ text: '👤 Профиль', callback_data: 'profile' }, { text: '💰 Баланс', callback_data: 'balance' }],
        [{ text: '🎮 Игры на токены', callback_data: 'games' }, { text: '🎁 Конкурсы', callback_data: 'contests' }],
        [{ text: '📋 О проекте', callback_data: 'about' }, { text: '🔗 Привязать аккаунт', callback_data: 'link_account' }]
    ]
};
const gamesMenu = {
    inline_keyboard: [
        [{ text: '🎲 Кости (x2)', callback_data: 'game_dice' }, { text: '🎯 Дартс (x3)', callback_data: 'game_darts' }],
        [{ text: '⚽ Футбол (x2.5)', callback_data: 'game_football' }, { text: '🏀 Баскетбол (x2)', callback_data: 'game_basketball' }],
        [{ text: '🎰 Угадай число (x5)', callback_data: 'game_number' }, { text: '✂️ Камень-ножницы (x2)', callback_data: 'game_rps' }],
        [{ text: '⬅️ Назад', callback_data: 'back_main' }]
    ]
};
async function getBetMenu(gameId, gameName, multiplier) {
    return {
        inline_keyboard: [
            [{ text: '🔹 10 токенов', callback_data: `bet_${gameId}_10` }, { text: '🔸 50 токенов', callback_data: `bet_${gameId}_50` }],
            [{ text: '🔹 100 токенов', callback_data: `bet_${gameId}_100` }, { text: '🔸 500 токенов', callback_data: `bet_${gameId}_500` }],
            [{ text: '⬅️ Назад', callback_data: 'games' }]
        ]
    };
}
const gameStates = new Map();

// --- ФУНКЦИИ БАЗЫ ДАННЫХ ---
async function checkUserRegistered(telegramId) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?telegram_id=eq.${telegramId}&select=id,balance`, {
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
        });
        const data = await response.json();
        if (data && data.length > 0) return { registered: true, userId: data[0].id, balance: data[0].balance };
        return { registered: false };
    } catch (error) { console.error(error); return { registered: false }; }
}
async function updateUserBalance(telegramId, newBalance) {
    try {
        await fetch(`${SUPABASE_URL}/rest/v1/profiles?telegram_id=eq.${telegramId}`, {
            method: 'PATCH',
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ balance: newBalance })
        });
    } catch (error) { console.error(error); }
}
async function editMessage(chatId, messageId, text, replyMarkup = null) {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`;
    const body = { chat_id: chatId, message_id: messageId, text: text, parse_mode: 'Markdown' };
    if (replyMarkup) body.reply_markup = replyMarkup;
    await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}
async function sendMessage(chatId, text, replyMarkup = null) {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const body = { chat_id: chatId, text: text, parse_mode: 'Markdown' };
    if (replyMarkup) body.reply_markup = replyMarkup;
    await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}

app.post('/webhook', async (req, res) => {
    const update = req.body;
    // Обработка обычных сообщений (для игры "Угадай число")
    if (update.message) {
        const message = update.message;
        const chatId = message.chat.id;
        const text = message.text || '';
        const username = message.from?.first_name || 'друг';
        const messageId = message.message_id;

        // Логика игры "Угадай число"
        if (gameStates.has(chatId)) {
            const game = gameStates.get(chatId);
            if (game.type === 'number_waiting_bet') {
                const bet = parseInt(text);
                if (isNaN(bet) || bet <= 0) {
                    await editMessage(chatId, messageId, '❌ Введи корректное число токенов для ставки!');
                    res.sendStatus(200); return;
                }
                const userCheck = await checkUserRegistered(chatId);
                if (!userCheck.registered) {
                    await editMessage(chatId, messageId, '❌ Ты не зарегистрирован!\n\n🔗 Привяжи аккаунт через меню или сайт.', mainMenu);
                    gameStates.delete(chatId);
                    res.sendStatus(200); return;
                }
                if (userCheck.balance < bet) {
                    await editMessage(chatId, messageId, `❌ Недостаточно токенов! У тебя ${userCheck.balance}, а ставка ${bet}.`, gamesMenu);
                    gameStates.delete(chatId);
                    res.sendStatus(200); return;
                }
                gameStates.set(chatId, { type: 'number_playing', number: game.number, bet: bet });
                await sendChatAction(chatId, 'typing');
                await editMessage(chatId, messageId, `🎲 *Угадай число*\n\nЯ загадал число от 1 до 100.\n💰 Твоя ставка: ${bet} токенов\n\n🔢 Введи своё предположение!`);
                res.sendStatus(200); return;
            }
            if (game.type === 'number_playing') {
                const guess = parseInt(text);
                if (isNaN(guess) || guess < 1 || guess > 100) {
                    await editMessage(chatId, messageId, '🔢 Введи число от 1 до 100!');
                    res.sendStatus(200); return;
                }
                const secretNumber = game.number; const bet = game.bet;
                if (guess === secretNumber) {
                    const winAmount = bet * 5;
                    const userCheck = await checkUserRegistered(chatId);
                    if (userCheck.registered) {
                        const newBalance = userCheck.balance + winAmount;
                        await updateUserBalance(chatId, newBalance);
                        await sendSticker(chatId, WIN_STICKER_ID);
                        await sendChatAction(chatId, 'typing');
                        await editMessage(chatId, messageId, `🎉 *ПОЗДРАВЛЯЮ!* 🎉\n\nТы угадал число ${secretNumber}!\n💰 Твой выигрыш: ${winAmount} токенов!\n📊 Новый баланс: ${newBalance} токенов`, gamesMenu);
                    }
                } else {
                    const userCheck = await checkUserRegistered(chatId);
                    if (userCheck.registered) {
                        const newBalance = userCheck.balance - bet;
                        await updateUserBalance(chatId, newBalance);
                        const hint = guess < secretNumber ? 'БОЛЬШЕ' : 'МЕНЬШЕ';
                        await sendSticker(chatId, LOSE_STICKER_ID);
                        await sendChatAction(chatId, 'typing');
                        await editMessage(chatId, messageId, `❌ *Неправильно!*\n\nЗагаданное число ${hint} чем ${guess}.\n💰 Ты проиграл ${bet} токенов.\n📊 Новый баланс: ${newBalance} токенов`, gamesMenu);
                    }
                }
                gameStates.delete(chatId);
                res.sendStatus(200); return;
            }
        }

        if (text === '/start') {
            const welcomeText = `✨ *Добро пожаловать в TaskFlow, ${username}!* ✨\n\n💎 *Многофункциональная платформа*\n\n🚀 *Основные возможности:*\n• Биржа заданий для продвижения\n• AI инструменты для контента\n• Быстрые услуги (лайки, подписки)\n• Токены — внутренняя валюта\n• Мини-игры на токены\n• Конкурсы и бонусы\n\n━━━━━━━━━━━━━━━━━━━━━━\n\n👇 *Выбери действие в меню*`;
            await sendMessage(chatId, welcomeText, mainMenu);
            await sendSticker(chatId, GAME_START_STICKER_ID);
            res.sendStatus(200); return;
        }
    }
    
    // Обработка нажатий на кнопки
    if (update.callback_query) {
        const callback = update.callback_query;
        const chatId = callback.message.chat.id;
        const messageId = callback.message.message_id;
        const data = callback.data;
        console.log(`Нажата кнопка: ${data} от пользователя ${chatId}`);

        // Обработка ставок в играх
        if (data.startsWith('bet_')) {
            const parts = data.split('_'); const gameId = parts[1]; const bet = parseInt(parts[2]);
            const userCheck = await checkUserRegistered(chatId);
            if (!userCheck.registered) {
                await editMessage(chatId, messageId, '❌ Ты не зарегистрирован!\n\n🔗 Привяжи аккаунт на сайте: ' + SITE_URL + '/profile', mainMenu);
                await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ callback_query_id: callback.id }) });
                res.sendStatus(200); return;
            }
            if (userCheck.balance < bet) {
                await editMessage(chatId, messageId, `❌ Недостаточно токенов! У тебя ${userCheck.balance}, а ставка ${bet}.`, gamesMenu);
                await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ callback_query_id: callback.id }) });
                res.sendStatus(200); return;
            }
            await sendChatAction(chatId, 'typing');

            // Логика разных игр
            switch(gameId) {
                case 'dice':
                    const diceResult = Math.floor(Math.random() * 6) + 1;
                    const diceWin = diceResult >= 4 ? bet * 2 : 0;
                    const diceNewBalance = userCheck.balance - bet + diceWin;
                    await updateUserBalance(chatId, diceNewBalance);
                    await editMessage(chatId, messageId, `🎲 *Игра в Кости (x2)*\n\nВыпало: ${diceResult}\n💰 Ставка: ${bet}\n${diceWin > 0 ? `✅ Ты выиграл ${diceWin} токенов! 🎉` : `❌ Ты проиграл ${bet} токенов`}\n📊 Новый баланс: ${diceNewBalance}`, gamesMenu);
                    if (diceWin > 0) await sendSticker(chatId, WIN_STICKER_ID);
                    else await sendSticker(chatId, LOSE_STICKER_ID);
                    break;
                case 'darts':
                    const dartsResult = Math.floor(Math.random() * 7) + 1;
                    const dartsWin = dartsResult === 7 ? bet * 3 : 0;
                    const dartsNewBalance = userCheck.balance - bet + dartsWin;
                    await updateUserBalance(chatId, dartsNewBalance);
                    await editMessage(chatId, messageId, `🎯 *Дартс (x3)*\n\nРезультат: ${dartsResult}${dartsResult === 7 ? ' — ЯБЛОЧКО!' : ''}\n💰 Ставка: ${bet}\n${dartsWin > 0 ? `✅ Ты выиграл ${dartsWin} токенов! 🎉` : `❌ Ты проиграл ${bet} токенов`}\n📊 Новый баланс: ${dartsNewBalance}`, gamesMenu);
                    if (dartsWin > 0) await sendSticker(chatId, WIN_STICKER_ID);
                    else await sendSticker(chatId, LOSE_STICKER_ID);
                    break;
                case 'football':
                    const footballResult = Math.floor(Math.random() * 4);
                    const footballWin = footballResult === 0 ? Math.floor(bet * 2.5) : 0;
                    const footballNewBalance = userCheck.balance - bet + footballWin;
                    await updateUserBalance(chatId, footballNewBalance);
                    const footballMessages = ['🥅 ГОЛ!', '🧤 Вратарь поймал мяч', '📐 Удар в штангу', '🌪️ Мимо ворот'];
                    await editMessage(chatId, messageId, `⚽ *Футбол (x2.5)*\n\n${footballMessages[footballResult]}\n💰 Ставка: ${bet}\n${footballWin > 0 ? `✅ Ты выиграл ${footballWin} токенов! 🎉` : `❌ Ты проиграл ${bet} токенов`}\n📊 Новый баланс: ${footballNewBalance}`, gamesMenu);
                    if (footballWin > 0) await sendSticker(chatId, WIN_STICKER_ID);
                    else await sendSticker(chatId, LOSE_STICKER_ID);
                    break;
                case 'basketball':
                    const basketballResult = Math.floor(Math.random() * 4);
                    const basketballWin = basketballResult === 0 ? bet * 2 : 0;
                    const basketballNewBalance = userCheck.balance - bet + basketballWin;
                    await updateUserBalance(chatId, basketballNewBalance);
                    const basketballMessages = ['🏀 Трёхочковый!', '🧱 Мимо кольца', '🎯 Точно в цель!', '💥 Блок-шот'];
                    await editMessage(chatId, messageId, `🏀 *Баскетбол (x2)*\n\n${basketballMessages[basketballResult]}\n💰 Ставка: ${bet}\n${basketballWin > 0 ? `✅ Ты выиграл ${basketballWin} токенов! 🎉` : `❌ Ты проиграл ${bet} токенов`}\n📊 Новый баланс: ${basketballNewBalance}`, gamesMenu);
                    if (basketballWin > 0) await sendSticker(chatId, WIN_STICKER_ID);
                    else await sendSticker(chatId, LOSE_STICKER_ID);
                    break;
                case 'number':
                    const secretNumber = Math.floor(Math.random() * 100) + 1;
                    gameStates.set(chatId, { type: 'number_waiting_bet', number: secretNumber });
                    await editMessage(chatId, messageId, `🎲 *Угадай число (x5)*\n\nВведи сумму ставки (минимум 10 токенов):`, gamesMenu);
                    break;
                case 'rps':
                    gameStates.set(chatId, { type: 'rps_waiting_bet' });
                    await editMessage(chatId, messageId, `✂️ *Камень-ножницы-бумага (x2)*\n\nВыбери свой вариант и введи ставку в следующем сообщении:`, gamesMenu);
                    break;
            }
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ callback_query_id: callback.id }) });
            res.sendStatus(200); return;
        }

        // Обработка RPS выбора
        if (data === 'rps_rock' || data === 'rps_paper' || data === 'rps_scissors') {
            gameStates.set(chatId, { type: 'rps_waiting_bet', choice: data });
            await editMessage(chatId, messageId, `✂️ *Камень-ножницы-бумага (x2)*\n\nВведи сумму ставки (минимум 10 токенов):`, gamesMenu);
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ callback_query_id: callback.id }) });
            res.sendStatus(200); return;
        }

        // Обработка обычных кнопок меню
        switch(data) {
            case 'back_main':
                await editMessage(chatId, messageId, '✨ *Главное меню TaskFlow* ✨', mainMenu);
                break;
            case 'about':
                await editMessage(chatId, messageId, `📋 *О ПРОЕКТЕ TASKFLOW*\n\n💎 *Многофункциональная платформа*\n\n🚀 *Основные возможности:*\n📋 *Биржа заданий* — продвижение через подписки, лайки, репосты\n🤖 *AI инструменты* — генератор постов, идей, сценариев, SEO\n⚡ *Быстрые услуги* — моментальное выполнение действий\n💎 *Токены* — внутренняя валюта для всего\n\n🎮 *Мини-игры на токены:*\n🎲 Кости | 🎯 Дартс | ⚽ Футбол | 🏀 Баскетбол | 🎰 Угадай число | ✂️ Камень-ножницы\n\n🎁 *Конкурсы и бонусы:*\n• Ежедневный бонус\n• Пригласи друга (+50 токенов)\n• Конкурс активности\n• Розыгрыши\n\n🔮 *В разработке:*\n• P2P обменник токенов\n• Мобильное приложение\n• AI-аналитика трендов\n• Голосовой ассистент\n\n📧 *Поддержка:* @aqquolaze\n🔗 *Сайт:* ${SITE_URL}`, mainMenu);
                break;
            case 'profile':
                const userCheckProfile = await checkUserRegistered(chatId);
                if (userCheckProfile.registered) {
                    await editMessage(chatId, messageId, `👤 *ПРОФИЛЬ*\n\n✅ Аккаунт привязан!\n\n💰 Баланс: ${userCheckProfile.balance} токенов\n🆔 ID: ${userCheckProfile.userId}\n\n🔗 ${SITE_URL}/profile`, mainMenu);
                } else {
                    await editMessage(chatId, messageId, `👤 *ПРОФИЛЬ*\n\n❌ Аккаунт не привязан!\n\n🔗 *Привяжи аккаунт на сайте:* ${SITE_URL}/profile\n\nПосле привязки ты сможешь играть на токены и видеть свой баланс.`, mainMenu);
                }
                break;
            case 'balance':
                const userCheckBalance = await checkUserRegistered(chatId);
                if (userCheckBalance.registered) {
                    await editMessage(chatId, messageId, `💰 *ТОКЕНЫ*\n\n💎 Твой баланс: ${userCheckBalance.balance} токенов\n\n🎮 *Играй и выигрывай!*`, mainMenu);
                } else {
                    await editMessage(chatId, messageId, `💰 *ТОКЕНЫ*\n\n❌ Аккаунт не привязан!\n\n🔗 *Привяжи аккаунт на сайте:* ${SITE_URL}/profile\n\nПосле привязки ты сможешь видеть баланс и играть.`, mainMenu);
                }
                break;
            case 'contests':
                await editMessage(chatId, messageId, `🎁 *КОНКУРСЫ*\n\n• Ежедневный бонус\n• Пригласи друга (+50 токенов)\n• Конкурс активности\n• Розыгрыши\n\n👉 ${SITE_URL}/contests`, mainMenu);
                break;
            case 'link_account':
                await editMessage(chatId, messageId, `🔗 *ПРИВЯЗКА АККАУНТА*\n\n1. Зайди на сайт: ${SITE_URL}\n2. Перейди в Профиль → Привязать Telegram\n3. Нажми на кнопку "Привязать"\n4. Бот автоматически свяжет аккаунты\n\n✅ *После привязки ты сможешь:*\n• Играть на токены\n• Проверять баланс\n• Получать уведомления\n\n📧 *Вопросы:* @aqquolaze`, mainMenu);
                break;
            case 'games':
                await editMessage(chatId, messageId, `🎮 *ИГРЫ НА ТОКЕНЫ*\n\n🎲 Кости (x2) — угадай выпадение\n🎯 Дартс (x3) — попади в яблочко\n⚽ Футбол (x2.5) — забей гол\n🏀 Баскетбол (x2) — трёхочковый\n🎰 Угадай число (x5) — угадай число\n✂️ Камень-ножницы (x2) — победи бота\n\n⚠️ *Для игры нужен привязанный аккаунт!*\n\n👇 *Выбери игру:*`, gamesMenu);
                break;
            case 'game_dice':
                await editMessage(chatId, messageId, `🎲 *Кости (x2)*\n\nВыбери ставку:`, await getBetMenu('dice', 'Кости', 2));
                break;
            case 'game_darts':
                await editMessage(chatId, messageId, `🎯 *Дартс (x3)*\n\nВыбери ставку:`, await getBetMenu('darts', 'Дартс', 3));
                break;
            case 'game_football':
                await editMessage(chatId, messageId, `⚽ *Футбол (x2.5)*\n\nВыбери ставку:`, await getBetMenu('football', 'Футбол', 2.5));
                break;
            case 'game_basketball':
                await editMessage(chatId, messageId, `🏀 *Баскетбол (x2)*\n\nВыбери ставку:`, await getBetMenu('basketball', 'Баскетбол', 2));
                break;
            case 'game_number':
                await editMessage(chatId, messageId, `🎰 *Угадай число (x5)*\n\nВыбери ставку:`, await getBetMenu('number', 'Угадай число', 5));
                break;
            case 'game_rps':
                await editMessage(chatId, messageId, `✂️ *Камень-ножницы (x2)*\n\nВыбери ставку:`, await getBetMenu('rps', 'Камень-ножницы', 2));
                break;
            default:
                await editMessage(chatId, messageId, '⚠️ Неизвестная команда', mainMenu);
        }
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ callback_query_id: callback.id }) });
        res.sendStatus(200); return;
    }
    res.sendStatus(200);
});

app.get('/', (req, res) => { res.send('🤖 TaskFlow Bot работает!'); });
const port = process.env.PORT || 3000;
app.listen(port, () => { console.log(`🤖 TaskFlow Bot запущен на порту ${port}`); });
