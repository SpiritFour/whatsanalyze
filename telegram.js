const fs = require('fs');

const TELEGRAM_JSON_PATH = '/Users/Mo/repos/whatsanalyze/Telegram Desktop/DataExport_2025-01-23/result.json'

let json = require(TELEGRAM_JSON_PATH)

const first_chat = json.chats.list[0]

const messages = first_chat.messages.filter(m => !!m.from)

const lines = messages.map(m => `${m.date.replace('T', ' ')} - ${m.from} : ${Array.isArray(m.text) ? m.text.reduce((p, c) => p + (typeof c === 'object' ? c.text : c), '') : m.text}`)

const txt = lines.reduce((p, c) => p + '\n' + c, '')

fs.writeFileSync('./telegram.txt', txt);
