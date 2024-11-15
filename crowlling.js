const axios = require('axios');
const cheerio = require('cheerio');

const puppeteer = require('puppeteer');
async function getStockData() {
	const investingCom = 'https://kr.investing.com/equities/tesla-motors';
	const naverInvestion =
		'https://m.stock.naver.com/worldstock/stock/TSLA.O/total';
	const browser = await puppeteer.launch();
	const page = await browser.newPage();

	// 크롤링할 URL로 이동
	await page.goto(naverInvestion); // 여기에 대상 웹사이트 URL을 입력하세요.

	// 해당 div 요소 선택
	const element = await page.$('strong.GraphMain_price__H72B2');

	// 텍스트 가져오기
	if (element) {
		const text = await page.evaluate((el) => el.textContent, element);
		await browser.close();
		return text;
	} else {
		await browser.close();
		return '가격 검색중';
	}
}

module.exports = { getStockData };
