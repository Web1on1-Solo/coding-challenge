const ChipChat = require('chipchat');
const bot = new ChipChat({ token: process.env.TOKEN });

// conversation assigned to the bot
bot.on('assign', async (m, c) => {
    console.log('', m.text);
    c.say('Hello agent');
});

// contact chat message (in a contact conversation)
bot.on('message.create.contact.chat.contact', (message, conversation) => {
    conversation.say('Hey, consumer', { role: 'agent' });
});

bot.start();
