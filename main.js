const TelegramBot = require("node-telegram-bot-api");
const fs = require('fs');
const axios = require('axios');
const settings = require('./settings');

const token = "Your_Token_Bot"
const options = {
    polling: true
}

const dipanbot = new TelegramBot(token, options)
const prefix = "/"
const gempa = new RegExp(`^${prefix}gempa$`)
const start = new RegExp(`^${prefix}start$`)
const kick = new RegExp(`^${prefix}kick$`)
const ban = new RegExp(`^${prefix}ban$`)

dipanbot.on("polling_error", (error) => {
    console.log(error);  // Menampilkan kesalahan polling di konsol
});

// add all user to database 

const usersFile = './users/users.json';

function readUsers() {
    if (!fs.existsSync(usersFile)) {
        fs.writeFileSync(usersFile, JSON.stringify([]));
    }
    const data = fs.readFileSync(usersFile);
    return JSON.parse(data);
}
function writeUsers(users) {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}
function addUser(user) {
    const users = readUsers();
    if (!users.some(u => u.id === user.id)) {
        users.push(user);
        writeUsers(users);
    }
}

// message with btn

dipanbot.onText(start, (callback) => {
    const username = callback.from.username
    const id = callback.from.id
    addUser({ id, username });
    const users = readUsers();
    const isGroup = callback.chat.type === 'group' || callback.chat.type === 'supergroup';
    const totalusers = users.length;
    const options = {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: '📝 List Menu',
                        callback_data: 'listMenu'
                    },
                    {
                        text: '🗄 All Menu',
                        callback_data: 'button2'
                    }
                ]
            ]
        }
    };
    const txt = `╭╌╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╌
       𝐇𝐚𝐥𝐥𝐨 𝐊𝐚𝐤 ${username} 👋
╰╌╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╌

╭╶╶╶ 𝐈𝐧𝐟𝐨𝐫𝐦𝐚𝐬𝐢 𝐔𝐬𝐞𝐫𝐬 𝐁𝐨𝐭 ╶╶╶
│
│ • 𝐔𝐬𝐞𝐫𝐧𝐚𝐦𝐞 : @${username}
│ • 𝐈𝐃 : ${id}
│ • 𝐓𝐨𝐭𝐚𝐥 𝐔𝐬𝐞𝐫𝐬 : ${totalusers}
╰╶╶╶`
    if (isGroup) {
        dipanbot.sendMessage(callback.chat.id, txt, options);
    } else {
        dipanbot.sendMessage(callback.chat.id, txt, options);
    }
})

dipanbot.on('callback_query', async (callbackQuery) => {
    const message = callbackQuery.message;

    if (callbackQuery.data === 'listMenu') {
        const BMKG_ENDPOINT = "https://data.bmkg.go.id/DataMKG/TEWS/";

        try {
            const apiCall = await fetch(BMKG_ENDPOINT + "autogempa.json");
            const {
                Infogempa: {
                    gempa: {
                        Jam, Magnitude, Tanggal, Wilayah, Potensi, Kedalaman, Dirasakan, Shakemap
                    }
                }
            } = await apiCall.json();
            const BmkgImage = BMKG_ENDPOINT + Shakemap;
            const resultText = `
Waktu: ${Tanggal} | ${Jam}
Wilayah: ${Wilayah}
Magnitude: ${Magnitude}
Potensi: ${Potensi}
Kedalaman: ${Kedalaman}
Dirasakan: ${Dirasakan}
            `;

            await dipanbot.sendPhoto(message.chat.id, BmkgImage, {
                caption: resultText
            });
        } catch (error) {
            console.error('Error fetching BMKG data:', error);
            dipanbot.sendMessage(message.chat.id, 'Terjadi kesalahan saat mengambil data gempa.');
        }
    } else if (callbackQuery.data === 'button2') {
        dipanbot.sendMessage(message.chat.id, 'Anda menekan Button 2');
    }
});

// Welcome User Joined To Group

dipanbot.on('new_chat_members', (msg) => {
    const chatId = msg.chat.id;
    const newMembers = msg.new_chat_members;
    const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup';
    const options = {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: '📝 Rules',
                        url: settings.rules
                    }
                ]
            ]
        }
    };

    newMembers.forEach((newMember) => {
        const username = newMember.username || newMember.first_name;
        const id = newMember.id;
        const messageJoin =
            `╭╌╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╌
  𝐖𝐞𝐥𝐜𝐨𝐦𝐞 𝐊𝐚𝐤 ${username} 👋
╰╌╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╾╌

╭╶╶╶ 𝐈𝐧𝐟𝐨𝐫𝐦𝐚𝐬𝐢 𝐔𝐬𝐞𝐫𝐬 ╶╶╶
│
│ • 𝐔𝐬𝐞𝐫𝐧𝐚𝐦𝐞 : @${username}
│ • 𝐈𝐃 : ${id}
╰╶╶╶.
            `
        if (isGroup) {
            dipanbot.sendMessage(chatId, messageJoin, options);
        } else {
            dipanbot.sendMessage(chatId, messageJoin, options);
        }
    });
});



// message no btn

dipanbot.onText(gempa, async (callback) => {
    const BMKG_ENDPOINT = "https://data.bmkg.go.id/DataMKG/TEWS/"


    const apiCall = await fetch(BMKG_ENDPOINT + "autogempa.json")
    const {
        Infogempa: {
            gempa: {
                Jam, Magnitude, Tanggal, Wilayah, Potensi, Kedalaman, Dirasakan, Shakemap
            }
        }
    } = await apiCall.json()
    const BmkgImage = BMKG_ENDPOINT + Shakemap
    const resultText = `
Waktu: ${Tanggal} | ${Jam}
Wilayah: ${Wilayah}
Magnitude: ${Magnitude}
Potensi: ${Potensi}
Kedalaman: ${Kedalaman}
Dirasakan: ${Dirasakan}
    `

    dipanbot.sendPhoto(callback.from.id, BmkgImage, {
        caption: resultText
    })
})



// Menangani pengguna yang meninggalkan grup
dipanbot.on('left_chat_member', (msg) => {
    const chatId = msg.chat.id;
    const leftMember = msg.left_chat_member;
    const username = leftMember.username || leftMember.first_name;

    dipanbot.sendMessage(chatId, `Sampai jumpa, ${username}. Semoga harimu menyenangkan! 👋`);
});


// Fungsi untuk mem-bisukan pengguna dalam grup
function banUser(chatId, userId, untilDate) {
    return dipanbot.restrictChatMember(chatId, userId, {
        permissions: {
            can_send_messages: false,
            can_send_media_messages: false,
            can_send_polls: false,
            can_send_other_messages: false,
            can_add_web_page_previews: false,
            can_change_info: false,
            can_invite_users: false,
            can_pin_messages: false
        },
        until_date: untilDate
    });
}

function banUser(chatId, userId, untilDate) {
    return dipanbot.restrictChatMember(chatId, userId, {
        permissions: {
            can_send_messages: false,
            can_send_media_messages: false,
            can_send_polls: false,
            can_send_other_messages: false,
            can_add_web_page_previews: false,
            can_change_info: false,
            can_invite_users: false,
            can_pin_messages: false
        },
        until_date: untilDate
    });
}

dipanbot.onText(ban, async (msg, match) => {
    const chatId = msg.chat.id;
    const reply = msg.reply_to_message;
    const banDuration = parseInt(match[1]);

    if (!reply) {
        dipanbot.sendMessage(chatId, 'Silakan balas pesan pengguna yang ingin Anda ban.');
        return;
    }

    const userId = reply.from.id;
    const untilDate = Math.floor(Date.now() / 1000) + (banDuration * 60);

    try {
        await banUser(chatId, userId, untilDate);
        dipanbot.sendMessage(chatId, `Pengguna telah dibisukan.`);
    } catch (error) {
        dipanbot.sendMessage(chatId, `Error banning user: ${error.message}`);
    }
});

