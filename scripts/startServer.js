import path from 'path';
import express from 'express';
import compression from 'compression';
import proxy from 'express-http-proxy';
import config from '../data/config.json';
import loadFile from './helper/loadFile';

function send404(res) {
	res.status(404);
	res.send('Not found');
}

function addHtmlHeaders(res) {
	res.set('Content-Security-Policy',
		'default-src \'self\';' +
		'style-src \'self\' \'unsafe-inline\';' +
		'script-src \'self\' https://www.googletagmanager.com http://www.google-analytics.com \'unsafe-inline\';' +
		'img-src \'self\' http://www.google-analytics.com;');
	res.set('X-Frame-Options', 'DENY');
	res.set('X-XSS-Protection', '1; mode=block');
}

export default async () => {
	console.log('Starting server');
	// create a new app
	const app = express();

	// compress anything you can!
	app.use(compression({ level: config.compressionLevel }));

	// add a nosniff header to all responses
	app.use((req, res, next) => {
		res.set('X-Content-Type-Options', 'nosniff');
		next();
	});

	// requests for .html files will 404
	app.get(/.*\.html/, (req, res) => send404(res));

	// requests for any of the main section pages
	for (let [ section, sectionData ] of Object.entries(config.sections)) {
		let uri = sectionData.uri;
		let filePath = path.join(__dirname, '..', 'build/html', `${uri}.html`);
		app.get(`/${uri}`, (req, res) => {
			addHtmlHeaders(res);
			res.sendFile(filePath);
		});
	}

	// requests for favicons
	app.use(express.static('web-assets/favicons'));

	// requests for images
	app.use(express.static('web-assets/images'));

	// requests for fonts
	app.use(express.static('web-assets/fonts'));

	// requests for Flash files
	app.use(express.static('web-assets/flash'));

	// requests for documents
	app.use(express.static('web-assets/documents'));	

	// requests for sprite sheets
	app.use(express.static('build/sprite-sheets'));

	// proxy some requests to other local servers
	try {
		let proxies = JSON.parse(await loadFile(path.join(__dirname, '..', 'build/proxies.json')));
		console.log('  Setting up proxies');
		for (let [ uri, port ] of Object.entries(proxies)) {
			app.use(uri, proxy(`localhost:${port}`));
		}
	}
	catch (err) {
		console.log(err);
		console.log('  Skipping proxies (build/proxies.json missing)');
	}

	// requests for html files
	app.use(express.static('build/html', {
		extensions: [ 'html' ],
		index: 'index.html',
		setHeaders: addHtmlHeaders
	}));

	// requests for robots.txt (allow all traffic)
	app.get('/robots.txt', (req, res) => {
		res.send('User-agent: *\nDisallow:');
	});

	// any requests that don't match any of the above should 404
	app.use((req, res) => send404(res));

	// start listening
	let port = process.env.PORT || 3000;
	app.listen(port);
	console.log(`  Server listening on port ${port}`);
};