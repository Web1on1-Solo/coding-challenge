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

// ** FUNCTION DEFINITIONS ** //

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

// THIS IS A STUB FUNCTION TO EMULATE A CHECK FOR THE NUMBER OF ORGANIZATIONS' LOCATIONS
const GET_LOCATIONS_STUB = async () => {
	return Array.from({ length:Math.floor(Math.random()*20) }, (a, b) => {
		return { name:'Location ' + (b+1) };
	});
};

// ** CHATBOT LOGIC ** //

// HERE WE DEFINE THE MAIN LOGIC FOR OUR BOT, THIS IS CONVENIENT TO HAVE IN A SINGLE PLACE FOR CLARITY
// ALL THE OTHER CODE IS EITHER BOILERPLATE OR PURE FUNCTIONS THAT SUPPORT THIS BEHAVIOR
// IT IS ALSO CONVENIENT TO ABSTRACT THIS LOGIC AWAY FROM THE REST OF THE CHATBOT IMPLEMENTATION
// SO THAT WE COULD EASILY MIGRATE THE 'BACKEND' THAT PROVIDES THE LATTER SERVICE
//  i.e. WE JUST COPY THIS TO A GOOGLE CF OR WHATEVER ELSE
const CHIPCHAT_LOGIC = {
	// botstep 1: WELCOME MESSAGE
	'1':async args => new Promise(done => {
		if(args.message.actions != null&&args.message.actions[0] != null) {
			switch (args.message.actions[0].payload) {
				case 'NEW_CAR':
				case 'USED_CAR':
					args.conversation.set('botstep', '2').then(() => CHIPCHAT_LOGIC['2'](args).then(done));
					break;
				case 'SOMETHING_ELSE':
					args.conversation.set('botstep', '1.1').then(() => {
						done({ send:{ text:'What would you like to talk about?' } });
					});
					break;
			}
		} else done({ send:[
				{ text:'Hi, I\'m your virtual assistant. I will help you schedule a video call appointment in 4 quick steps.' },
				{ actions:[
					{ payload:'USED_CAR', text:'Used car', type:'reply' },
					{ payload:'NEW_CAR', text:'New car', type:'reply' },
					{ payload:'SOMETHING_ELSE', text:'Something else', type:'reply' }
				], text:'1/4: What would you like to discuss in our Video Call?' }
			] });
	}),
	'1.1':async args => new Promise(done => {
		args.conversation.set('botstep', '2').then(() => CHIPCHAT_LOGIC['2'](args).then(done));
	}),
	// botstep 2: PICK A DATE AND A TIME
	'2':async args => new Promise(done => {
		// WHEN THE USER OPENS THE WEBVIEW A postback MESSAGE IS TRIGGERED AND WE DO NOT WISH TO SEND THE USER THE WEBVIEW AGAIN, SO WE HAVE TO CHECK FOR THAT AND THE ONLY PROPERTY THAT DISTINGUISHES THE WEBVIEW MESSAGE IS THE PROPERTY meta.size
		if(args.message.meta == null||args.message.meta.size != 'full') done({ send:[
			{
				actions:[{
					fallback:'https://bot.moralestapia.com/misc/datepicker/?data=' + AES256_CIPHER({ conversation_id:args.conversation.id }),
					size:'full',
					text:'Set up your appointment',
					type:'webview',
					uri:'https://bot.moralestapia.com/misc/datepicker/?data=' + AES256_CIPHER({ conversation_id:args.conversation.id })
				}],
				role:'agent',
				text:'2/4 Thank you. Please choose your preferred date and time.'
			},
		] });
	}),
	'3':async args => new Promise(done => {
		GET_LOCATIONS_STUB().then(locations => {
			if(locations.length <= 10) args.conversation.set('botstep', '3.1').then(() => CHIPCHAT_LOGIC['3.1'](args).then(done));
			else args.conversation.set('botstep', '3.2').then(() => CHIPCHAT_LOGIC['3.2'](args).then(done));
		});
	}),
	'3.1':async args => new Promise(async done => {
		if(args.message.actions != null&&args.message.actions[0] != null) {
			args.conversation.set('botstep', '4').then(() => CHIPCHAT_LOGIC['4'](args).then(done));
		} else {
			const locations = (await GET_LOCATIONS_STUB()).slice(0, 10);

			done({ send:{
					actions:locations.map(v => {
						return { payload:v.name, text:v.name, type:'reply' };
					}),
					text:'3/4 Thank you. Please choose your preferred location.' }
				});
		}
	}),
	'3.2':async args => new Promise(done => {
		args.conversation.set('botstep', '3.3').then(() => done({ send:{ text:'3/4 Please tell us your postal code, so we can book the video call with the right specialist on location.' } }));
	}),
	'3.3':async args => new Promise(async done => {
		await args.conversation.set('locationname', args.message.text);

		if(args.message.actions != null&&args.message.actions[0] != null) {
			switch (args.message.actions[0].payload) {
				case 'YES':
					args.conversation.set('botstep', '4').then(() => CHIPCHAT_LOGIC['4'](args).then(done));
					break;
				case 'NO':
					args.conversation.set('botstep', '3.3.1').then(() => done({ send:{ text:'OK, no problem. Could you please tell us the name of the location you would like to have the video call with?' } }));
					break;
			}
		} else done({ send:{
				actions:[
					{ payload:'YES', text:'Yes', type:'reply' },
					{ payload:'NO', text:'No', type:'reply' }
				],
				text:'Thank you, the videocall will take place with someone from ' + args.conversation.get('locationname') + ', is this ok for you?'
			} });
	}),
	'3.3.1':async args => new Promise(done => {
		args.conversation.set('botstep', '4').then(() => CHIPCHAT_LOGIC['4'](args).then(done));
	}),
	'4':async args => new Promise(done => {
		done({ send:{
				actions:[
					{ payload:'WHATSAPP', text:'WhatsApp', type:'reply' },
					{ payload:'PHONE', text:'Phone', type:'reply' },
					{ payload:'EMAIL', text:'Email', type:'reply' }
				],
				text:'4/4 How can we confirm the booking?'
			} });
	}),
};

// HERE WE PROCESS THE VALUES THAT COME FROM CHIPCHAT_LOGIC CALLS
const CHIPCHAT_LOGIC_DISPATCH = async args => {
	if(args != null&&args.data != null&&args.data.send != null) BOT.send(args.conversation.id, args.data.send);
};

// ** BOILERPLATE ** //

MODULE.EXPRESS()
	// .use(BOT.router()) // <-- I WAS NOT ABLE TO SET UP CHIPCHAT LIKE THIS, I WILL FIGURE IT OUT LATER IF THERE'S TIME, NOT A PRIORITY TBH
	.use(MODULE.EXPRESS.json())

	.get('/misc/datepicker', (req, res) => MODULE.FS.readFile(__dirname + '/misc/datepicker/index.html', (e, d) => res.status(200).append('Content-Type', 'text/html;charset=utf-8').send(d)))

	.get('/web1on1/webhook/', (req, res) => {
		req.url = MODULE.URL.parse(req.url, true);

		if(req.url.query.type == 'subscribe'&&req.url.query.challenge != null) res.status(200).append('Content-Type', 'text/plain').send(req.url.query.challenge);
		else res.status(400).end();
	})

	.post('/web1on1/webhook/', (req, res) => {
		BOT.ingest(req.body); // ? - DOES THE NODE SDK PERFORM PAYLOAD VERIFICATION AUTOMATICALLY? I ASSUME YES, BUT WOULD HAVE TO CHECK THAT OUT LATER

		res.status(200).send();
	})

	// HERE, THE RESULT FROM THE WEBVIEW IS PARSED (AND VERIFIED IMPLICITLY), THEIR VALUES ARE STORED IN THE metaDATA OF THE CONVERSATION AND THE NEXT STEP OF THE CONVERSATIONAL LOGIC IS CALLED
	.post('/web1on1/webhook/appointment/setup', (req, res) => {
		if(req.body.data != null) {
			req.body.data.data = AES256_DECIPHER(req.body.data.data);

			if(req.body.data.data != null&&req.body.data.data.conversation_id != null) BOT.conversation(req.body.data.data.conversation_id).then(async conversation => {
				await conversation.set('date', req.body.data.Date);
				await conversation.set('time', req.body.data.Time);

				conversation.set('botstep', '3').then(() => CHIPCHAT_LOGIC['3']({ conversation:conversation, message:{} }).then(data => CHIPCHAT_LOGIC_DISPATCH({ conversation:conversation, data:data })));
			});
		}

		res.status(200).send();
	})

	.listen(CONFIG.EXPRESS.PORT);

BOT
	.on('message', async (message, conversation) => {
		// SOME DEBUG MESSAGES LEFT HERE FOR CONVENIENCE (IGNORE)
		// console.log('conversation.id', conversation.id);
		// console.log('conversation', JSON.stringify(conversation));
		console.log('message', JSON.stringify(message));

		// A SMALL CHECK TO RESETS THE CHATBOT IF NEEDED
		await new Promise(done => {
				if(message.text.toLowerCase().trim() == 'start over') conversation.set('botstep', '').then(done);
				else done();
			});

		// WE NEED TO CHECK IF botstep IS SET, OTHERWISE INITIALIZE IT TO '1'
		await new Promise(done => {
				if(conversation.get('botstep') == null||conversation.get('botstep') == '') conversation.set('botstep', '1').then(done);
				else done();
			});

		// WE DISPATCH THE CURRENT MESSAGE TO THE APPROPRIATE RESPONDER BASED ON THE CURRENT botstep
		if(CHIPCHAT_LOGIC[conversation.get('botstep')] != null) CHIPCHAT_LOGIC[conversation.get('botstep')]({ conversation:conversation, message:message }).then(data => CHIPCHAT_LOGIC_DISPATCH({ conversation:conversation, data:data }));
	});
