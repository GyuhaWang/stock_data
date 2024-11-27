const puppeteer = require('puppeteer');
const fs = require('fs');
const axios = require('axios');

let browser, page; // Puppeteer 브라우저와 페이지를 관리
const getPolygonIoPreviousClose = async () => {
	try {
		const response = await axios.get(
			`https://api.polygon.io/v2/aggs/ticker/TSLA/prev?adjusted=true&apiKey=${process.env.POLYGON_API_KEY}`
		); // API URL 변경
		const res_json = response.data;
		if (res_json.status == 'OK' && res_json.count >= 1) {
			return res_json.results[0];
		} else {
			throw Error;
		}
	} catch (error) {
		console.error('API 호출 중 오류 발생:', error.message);
		throw Error;
	}
};
const getPolygonIoNews = async () => {
	try {
		const response = await axios.get(
			`https://api.polygon.io/v2/reference/news?ticker=TSLA&order=desc&limit=20&sort=published_utc&apiKey=${process.env.POLYGON_API_KEY}`
		); // API URL 변경
		const res_json = response.data;
		if (res_json.status == 'OK' && res_json.results.length >= 1) {
			return res_json.results;
		} else {
			throw Error;
		}
	} catch (error) {
		console.error('API 호출 중 오류 발생:', error.message);
		throw Error;
	}
};
const initializeBrowser = async () => {
	browser = await puppeteer.launch({
		executablePath: process.env.CHROME_URL,
		headless: true,
		args: ['--no-sandbox', '--disable-setuid-sandbox'],
	});
	page = await browser.newPage();
	console.log('Browser initialized.');
};

const closeBrowser = async () => {
	if (browser) {
		await browser.close();
		console.log('Browser closed.');
	}
};

const saveData = (data, filePath) => {
	const timestamp = new Date().toISOString();
	const entry = { timestamp, data };

	let existingData = [];
	if (fs.existsSync(filePath)) {
		existingData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
	}
	existingData.push(entry);
	fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));
};

const crawl = async () => {
	const naverInvestion =
		'https://m.stock.naver.com/worldstock/stock/TSLA.O/total';
	try {
		if (!page) {
			console.error('Browser or page not initialized!');
			return;
		}

		await page.goto(naverInvestion, {
			waitUntil: 'domcontentloaded',
			timeout: 3000,
		});
		await page.waitForSelector('strong.GraphMain_price__H72B2', {
			timeout: 1000,
		});
		const priceElement = await page.$('strong.GraphMain_price__H72B2');
		const gapElement = await page.$('div.VGap_stockGap__b4Rxp');
		let price = '가격 검색 중';
		let gap = '-';
		// emit data

		if (priceElement) {
			price = await page.evaluate((el) => el.textContent, priceElement);
		} else {
			price = null;
		}
		if (gapElement) {
			gap = await page.evaluate((el) => el.textContent, gapElement);
		} else {
			gap = null;
		}

		await page.reload(naverInvestion);
		return { price: price, gap: gap };
	} catch (error) {
		console.error('Error during crawling:', error.message);
	}
};

// 모듈화
module.exports = {
	initializeBrowser,
	closeBrowser,
	crawl,
	getPolygonIoPreviousClose,
	getPolygonIoNews,
};
