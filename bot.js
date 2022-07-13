// const ChipChat = require('chipchat');
// const bot = new ChipChat({ token: process.env.TOKEN });

// bot.on('assign', async (m, c) => {
// 	console.log('', m.text);
// 	c.say('Hello agent');
// });

// bot.on('message.create.contact.chat.contact', (message, conversation) => {
// 	conversation.say('Hey, consumer', { role: 'agent' });
// });

// bot.start();

const CONFIG = require('./config.js');

const MODULE = {
	CHIPCHAT:require('chipchat'),
	EXPRESS:require('express'),
	FS:require('fs'),
	URL:require('url')
};

MODULE.FS.watchFile(__filename, { internval:500 }, () => process.exit(0));

console.log(Date.now());

const BOT = new MODULE.CHIPCHAT({
		email:CONFIG.WEB1ON1.BOT.clientId,
		refreshToken:CONFIG.WEB1ON1.BOT['Refresh Token'],
		secret:CONFIG.WEB1ON1.BOT.WEBHOOK.SECRET,
		token:CONFIG.WEB1ON1.BOT['API Token']
	});

MODULE.EXPRESS()
	// .use(BOT.router()) // <-- I WAS NOT ABLE TO SET IT UP LIKE THIS, PERHAPS THE DOCS NEED A REVISION
	.use(MODULE.EXPRESS.json())

	.get('/web1on1/webhook/', (req, res) => {
		req.url = MODULE.URL.parse(req.url, true);

		if(req.url.query.type == 'subscribe'&&req.url.query.challenge != null) res.status(200).append('Content-Type', 'text/plain').send(req.url.query.challenge);
		else res.status(400).end();
	})

	.post('/web1on1/webhook/', (req, res) => {
			BOT.ingest(req.body); // ? - DOES THE NODE SDK PERFORM VERIFICATION AUTOMATICALLY?

			res.status(200).send();
		})


	.listen(CONFIG.EXPRESS.PORT);

BOT
	.on('message', (message, conversation) => {
			console.log('message', message);
		});
