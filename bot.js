const CONFIG = require('./config.js');

const MODULE = {
	CHIPCHAT:require('chipchat'),
	CRYPTO:require('crypto'),
	EXPRESS:require('express'),
	FS:require('fs'),
	HTTPS:require('https'),
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

// ** FUNCTION DEFINITIONS **

const HTTPS_POST_PATCH_MESSAGE = async args => new Promise(done => {
		// (I DON'T KNOW WHAT YOU USE TO DOCUMENT CODE BUT IN THE MEANTIME I¡LL EXPLAIN LIKE THIS)
		// 
		// THE FUNCTION HTTPS_POST_PATCH_MESSAGE RECEIVES AND OBJECT LIKE { message_id:..., <other args> ... } AND PERFORMS A PATCH REQUEST TO THE SPECIFIED MESSAGE ENDPOINT IN ORDER TO UPDATE ITS CONTENTS
		// IT RETURNS AND OBJECT LIKE { s:<STATUS CODE OF THE RESPONSE>, h:<RESPONSE HEADERS>, d:<RESPONSE DATA (IF THERE'S ANY)> }
		var r = MODULE.HTTPS.request({
				headers:{ 'Authorization':'Bearer ' + CONFIG.WEB1ON1.BOT['API Token'], 'Content-Type':'application/json' },
				host:MODULE.URL.parse(CONFIG.WEB1ON1.ENDPOINT).host,
				path:MODULE.URL.parse(CONFIG.WEB1ON1.ENDPOINT).pathname + 'messages/' + args.message_id,
				port:443,
				method:'PATCH'
			}, res => {
					var d = null;

					res
						.on('data', _d => (d = d||[]).push(_d))
						.on('end', () => d != null ? done({ s:res.statusCode, h:res.headers, d:d }) : done({ s:res.statusCode, h:res.headers }));
				});

		r.end(JSON.stringify({ text:args.text }));
	});

// THESE TWO FUNCTIONS, AES256_CIPHER (TO SERIALIZE) AND AES256_DECIPHER (TO DESERIALIZE=, ARE MEANT TO PACK DATA IN A 'SECURE' MANNER SO THAT WE CAN EXCHANGE MESSAGES BETWEEN THE WEBVIEW AND THE BACKEND AND EXTEND THE CONVERSATION THERE
const AES256_CIPHER = data => {
	var iv = MODULE.CRYPTO.randomBytes(16);
	var e = MODULE.CRYPTO.createCipheriv('aes256', '01234567890123456789012345678901', iv);

	return Buffer.from(JSON.stringify({ data:e.update(JSON.stringify(data), 'utf8', 'base64') + e.final('base64'), iv:iv.toString('base64') })).toString('base64url');
};

const AES256_DECIPHER = data => {
	try {
		data = JSON.parse(Buffer.from(data, 'base64url'));

		var d = MODULE.CRYPTO.createDecipheriv('aes256', '01234567890123456789012345678901', Buffer.from(data.iv, 'base64'));
		return JSON.parse(d.update(data.data, 'base64', 'utf8') + d.final('utf8'));
	} catch(e) {}
};

// HERE WE DEFINE THE MAIN LOGIC FOR OUR BOT, THIS IS CONVENIENT TO HAVE IN A SINGLE PLACE FOR CLARITY
// ALL THE OTHER CODE IS EITHER BOILERPLATE OR PURE FUNCTIONS THAT SUPPORT THIS BEHAVIOR
// IT IS ALSO CONVENIENT TO ABSTRACT THIS LOGIC AWAY FROM THE REST OF THE CHATBOT IMPLEMENTATION
// SO THAT WE COULD EASILY MIGRATE THE 'BACKEND' THAT PROVIDES THE LATTER SERVICE
//  i.e. WE JUST COPY THIS TO A GOOGLE CF OR WHATEVER ELSE
const CHIPCHAT_LOGIC = {
	// botstep 1: WELCOME MESSAGE
	'1':async args => new Promise(done => {
		done({ send:[
			{ text:'Hi, I\'m your virtual assistant. I will help you schedule a video call appointment in 4 quick steps.' },
			{ actions:[
				{ type:'reply', text:'Used car', payload:'USED_CAR' },
				{ type:'reply', text:'New car', payload:'NEW_CAR' },
				{ type:'reply', text:'Something else', payload:'SOMETHING_ELSE' }
			], text:'1/4: What would you like to discuss in our Video Call?' }
		] });
	})
};

MODULE.EXPRESS()
	// .use(BOT.router()) // <-- I WAS NOT ABLE TO SET IT UP LIKE THIS, PERHAPS THE DOCS NEED A REVISION
	.use(MODULE.EXPRESS.json())

	.get('/misc/datepicker', (req, res) => MODULE.FS.readFile(__dirname + '/misc/datepicker/index.html', (e, d) => res.status(200).append('Content-Type', 'text/html;charset=utf-8').send(d)))

	.get('/web1on1/webhook/', (req, res) => {
		req.url = MODULE.URL.parse(req.url, true);

		if(req.url.query.type == 'subscribe'&&req.url.query.challenge != null) res.status(200).append('Content-Type', 'text/plain').send(req.url.query.challenge);
		else res.status(400).end();
	})

	.post('/web1on1/webhook/', (req, res) => {
		BOT.ingest(req.body); // ? - DOES THE NODE SDK PERFORM PAYLOAD VERIFICATION AUTOMATICALLY? I ASSUME YES, BUT WOULD NEED TO CHECK THAT OUT

		res.status(200).send();
	})

	.post('/web1on1/webhook/appointment/setup', (req, res) => {
		console.log('data', req.body);

		if(req.body.data != null) {
			req.body.data.data = AES256_DECIPHER(req.body.data.data);

			if(req.body.data.data != null&&req.body.data.data.conversation_id != null) BOT.send(req.body.data.data.conversation_id, { text:Date.now() + ':TIME AND DATE SET ...' }).then(d => console.log('DONE ...'));
		}

		res.status(200).send();
	})

	.listen(CONFIG.EXPRESS.PORT);

BOT
	.on('message', async (message, conversation) => {
		// console.log('message', conversation.id);
		console.log('message', JSON.stringify(message));
		// console.log('conversation', JSON.stringify(conversation));

		// WE NEED TO CHECK IF botstep IS SET, THIS IS EQUIVALENT TO SOME SORT OF MINIMAL SET UP
		await new Promise(done => {
				if(conversation.get('botstep') == null) conversation.set('botstep', '1').then(done);
				else done();
			});

		// WE DISPATCH THE CURRENT MESSAGE TO THE APPROPRIATE RESPONDER BASED ON THE CURRENT botstep
		if(CHIPCHAT_LOGIC[conversation.get('botstep')] != null) CHIPCHAT_LOGIC[conversation.get('botstep')]({ conversation:conversation, message:message }).then(d => {
			// HERE WE CHECK IF WE RECEIVE AN OBJECT IN THE CALLBACK, IF THAT'S THE CASE WE SHOULD FULFILL IT'S INTENT, WHICH IS CURRENTLY QUITE SIMPLE (BOT.send ...)
			if(d != null&&d.send != null) BOT.send(conversation.id, d.send);
		});
	});
