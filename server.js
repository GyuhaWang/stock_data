const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const puppeteer = require('puppeteer');
const app = express();
const server = http.createServer(app);

const io = socketIO(server, {
	cors: {
		origin: `http://localhost:3000`,
		methods: ['GET', 'POST'],
	},
});

io.on('connection', async (socket) => {
	console.log('클라이언트 접근');

	const naverInvestion =
		'https://m.stock.naver.com/worldstock/stock/TSLA.O/total';
	const browser = await puppeteer.launch();
	const page = await browser.newPage();

	const intervalId = setInterval(async () => {
		try {
			await page.goto(naverInvestion, {
				waitUntil: 'domcontentloaded',
				timeout: 10000,
			});
			await page.waitForSelector('strong.GraphMain_price__H72B2', {
				timeout: 5000,
			});
			const priceElement = await page.$('strong.GraphMain_price__H72B2');
			const gapElement = await page.$('div.VGap_stockGap__b4Rxp');

			let price = '가격 검색 중';
			let gap = '-';
			if (priceElement) {
				price = await page.evaluate((el) => el.textContent, priceElement);
			}
			if (gapElement) {
				gap = await page.evaluate((el) => el.textContent, gapElement);
			}

			socket.emit('stockData', { price: price, gap: gap });
		} catch (error) {
			console.error('Error ----------', error);
		}
	}, 1000);

	socket.on('disconnect', async () => {
		console.log('User disconnected');
		clearInterval(intervalId);
		await browser.close();
	});

	// socket.on('stockData', (msg) => {
	// 	console.log('Received stockData:', msg);
	// 	io.emit('stockData', msg);
	// });
});

server.listen(3001, () => {
	console.log('Listening on *:3001');
});
