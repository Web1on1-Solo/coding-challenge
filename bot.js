const CONFIG = require('./config.js');

const MODULE = {
	CHIPCHAT:require('chipchat'),
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

MODULE.EXPRESS()
	// .use(BOT.router()) // <-- I WAS NOT ABLE TO SET IT UP LIKE THIS, PERHAPS THE DOCS NEED A REVISION
	.use(MODULE.EXPRESS.json())

	.get('/web1on1/webhook/', (req, res) => {
		req.url = MODULE.URL.parse(req.url, true);

		if(req.url.query.type == 'subscribe'&&req.url.query.challenge != null) res.status(200).append('Content-Type', 'text/plain').send(req.url.query.challenge);
		else res.status(400).end();
	})

	.post('/web1on1/webhook/', (req, res) => {
		BOT.ingest(req.body); // ? - DOES THE NODE SDK PERFORM PAYLOAD VERIFICATION AUTOMATICALLY? I ASSUME YES, BUT HAVE TO CHECK IT OUT

		res.status(200).send();
	})

	.listen(CONFIG.EXPRESS.PORT);
