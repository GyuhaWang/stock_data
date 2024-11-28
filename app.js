const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const schedule = require('node-schedule');
const stockRoutes = require('./src/routes/stock/stockRoute');
const chatController = require('./src/services/chat/chatController');
const countController = require('./src/services/count/countController');

const {
	getPolygonIoPreviousClose,
	getPolygonIoNews,
} = require('./src/services/stock/stockService');
require('dotenv').config();

const app = express();
const server = http.createServer(app); // Express 서버로 HTTP 서버 생성
const io = new Server(server, {
	cors: {
		origin: process.env.CORS_URL, // 허용할 클라이언트 도메인
		methods: ['GET', 'POST'], // 허용할 HTTP 메서드
		credentials: true, // 인증 정보(쿠키 등)를 포함할지 여부
	},
});

// 접속자 변수
let currentUserCount = 0;
let todayUserCount = 0;

// 크롤링 데이터 변수
const sampleStockData = {
	T: 'TSLA',
	v: 57181887,
	vw: 333.1337,
	o: 341.8,
	c: 332.89,
	h: 342.55,
	l: 326.59,
	t: 1732741200000,
	n: 878126,
};
const sampleNewsData = [
	{
		id: '6ab61f3597ecf792ea71b486490be65fb998cb547bac4df538f30874cc4f03f0',
		publisher: {
			name: 'The Motley Fool',
			homepage_url: 'https://www.fool.com/',
			logo_url:
				'https://s3.polygon.io/public/assets/news/logos/themotleyfool.svg',
			favicon_url:
				'https://s3.polygon.io/public/assets/news/favicons/themotleyfool.ico',
		},
		title: 'Can Dogecoin Reach $1?',
		author: 'Anthony Di Pizio',
		published_utc: '2024-11-26T09:39:00Z',
		article_url:
			'https://www.fool.com/investing/2024/11/26/can-dogecoin-reach-1/?source=iedfolrf0000001',
		tickers: ['TSLA'],
		image_url:
			'https://g.foolcdn.com/editorial/images/798759/a-shiba-inu-dog-sitting-in-front-of-a-blank-chalk-board.jpg',
		description:
			"Dogecoin has surged 338% in 2024 so far, driven by former President Trump's win and Elon Musk's role in the incoming administration. However, the article cautions that Dogecoin has no real utility and its recent rally may not be sustainable.",
		keywords: ['Dogecoin', 'Elon Musk', 'Donald Trump', 'cryptocurrency'],
		insights: [
			{
				ticker: 'TSLA',
				sentiment: 'neutral',
				sentiment_reasoning:
					"The article mentions Tesla CEO Elon Musk's involvement with Dogecoin, but this is not the main focus of the article.",
			},
		],
	},
	{
		id: '244ea43e198447817e268703d37bb429eee712bb355c8021a845e2cdef7a05e2',
		publisher: {
			name: 'Benzinga',
			homepage_url: 'https://www.benzinga.com/',
			logo_url: 'https://s3.polygon.io/public/assets/news/logos/benzinga.svg',
			favicon_url:
				'https://s3.polygon.io/public/assets/news/favicons/benzinga.ico',
		},
		title:
			"As Nvidia Maintains Chip Supremacy, Jim Cramer Says Foes Of Semiconductor Giant 'Aren't Really Enemies'",
		author: 'Kaustubh Bagalkote',
		published_utc: '2024-11-26T02:17:45Z',
		article_url:
			'https://www.benzinga.com/news/global/24/11/42179729/as-nvidia-maintains-chip-supremacy-jim-cramer-says-the-so-called-enemies-of-semiconductor-giant-arent',
		tickers: ['NVDA', 'GOOG', 'GOOGL', 'TSLA'],
		image_url:
			'https://cdn.benzinga.com/files/images/story/2024/11/25/untitled_0.jpeg?width=1200&height=800&fit=crop',
		description:
			"Nvidia continues to dominate the AI semiconductor market, with CNBC's Jim Cramer stating that no company can successfully challenge the tech giant's technological supremacy. Nvidia's recent earnings report and collaborations with companies like Google and Tesla demonstrate its commitment to innovation.",
		keywords: [
			'Nvidia',
			'semiconductor',
			'artificial intelligence',
			'Jim Cramer',
		],
		insights: [
			{
				ticker: 'NVDA',
				sentiment: 'positive',
				sentiment_reasoning:
					"The article highlights Nvidia's dominant position in the AI semiconductor market, with its recent earnings report and collaborations with major tech companies demonstrating its technological leadership and commitment to innovation.",
			},
			{
				ticker: 'GOOG',
				sentiment: 'positive',
				sentiment_reasoning:
					"Nvidia's collaboration with Alphabet's Google Quantum AI is mentioned as an example of the company's commitment to technological innovation.",
			},
			{
				ticker: 'GOOGL',
				sentiment: 'positive',
				sentiment_reasoning:
					"Nvidia's collaboration with Alphabet's Google Quantum AI is mentioned as an example of the company's commitment to technological innovation.",
			},
			{
				ticker: 'TSLA',
				sentiment: 'positive',
				sentiment_reasoning:
					"Nvidia's initiatives in robotics with companies like Tesla are cited as evidence of the company's technological advancements.",
			},
		],
	},
	{
		id: 'd20e57564efa0851305afa9c1af6cd12adbe130f1eab7d599b960ccb46c3b085',
		publisher: {
			name: 'The Motley Fool',
			homepage_url: 'https://www.fool.com/',
			logo_url:
				'https://s3.polygon.io/public/assets/news/logos/themotleyfool.svg',
			favicon_url:
				'https://s3.polygon.io/public/assets/news/favicons/themotleyfool.ico',
		},
		title:
			"Prediction: President-elect Donald Trump's Plan to Cancel Tax Credits on Electric Vehicles Will Help Tesla",
		author: 'Adam Spatacco',
		published_utc: '2024-11-26T01:45:00Z',
		article_url:
			'https://www.fool.com/investing/2024/11/25/prediction-president-elect-donald-trumps-plan-to-c/?source=iedfolrf0000001',
		tickers: ['TSLA', 'F', 'FpB', 'FpC', 'FpD', 'GM'],
		image_url:
			'https://g.foolcdn.com/editorial/images/798632/getty-tax-credit-irs.jpg',
		description:
			"The article discusses how the removal of electric vehicle tax credits by President-elect Donald Trump could actually benefit Tesla, as it would make it harder for smaller competitors to enter the market and compete with Tesla's premium products.",
		keywords: ['electric vehicles', 'tax credits', 'Tesla'],
		insights: [
			{
				ticker: 'TSLA',
				sentiment: 'positive',
				sentiment_reasoning:
					"The article suggests that Tesla would benefit from the removal of electric vehicle tax credits, as it would make it harder for smaller competitors to enter the market and compete with Tesla's premium products.",
			},
			{
				ticker: 'F',
				sentiment: 'negative',
				sentiment_reasoning:
					"The article suggests that the removal of electric vehicle tax credits would be a big blow for legacy automakers like Ford, as they rely more on subsidies to entice consumers to try out their alternatives to Tesla's vehicles.",
			},
			{
				ticker: 'FpB',
				sentiment: 'negative',
				sentiment_reasoning:
					"The article suggests that the removal of electric vehicle tax credits would be a big blow for legacy automakers like Ford, as they rely more on subsidies to entice consumers to try out their alternatives to Tesla's vehicles.",
			},
			{
				ticker: 'FpC',
				sentiment: 'negative',
				sentiment_reasoning:
					"The article suggests that the removal of electric vehicle tax credits would be a big blow for legacy automakers like Ford, as they rely more on subsidies to entice consumers to try out their alternatives to Tesla's vehicles.",
			},
			{
				ticker: 'FpD',
				sentiment: 'negative',
				sentiment_reasoning:
					"The article suggests that the removal of electric vehicle tax credits would be a big blow for legacy automakers like Ford, as they rely more on subsidies to entice consumers to try out their alternatives to Tesla's vehicles.",
			},
			{
				ticker: 'GM',
				sentiment: 'negative',
				sentiment_reasoning:
					"The article suggests that the removal of electric vehicle tax credits would be a big blow for legacy automakers like General Motors, as they rely more on subsidies to entice consumers to try out their alternatives to Tesla's vehicles.",
			},
		],
	},
	{
		id: 'f3a43167cc960d2085dbaa5d08059ec6d52c249ffce1c0a332a823e022450dd9',
		publisher: {
			name: 'The Motley Fool',
			homepage_url: 'https://www.fool.com/',
			logo_url:
				'https://s3.polygon.io/public/assets/news/logos/themotleyfool.svg',
			favicon_url:
				'https://s3.polygon.io/public/assets/news/favicons/themotleyfool.ico',
		},
		title: "Here's Why Rivian Stock Is a Buy Before Nov. 30",
		author: 'Ryan Vanzo',
		published_utc: '2024-11-25T15:15:00Z',
		article_url:
			'https://www.fool.com/investing/2024/11/25/heres-why-rivian-stock-is-a-buy-before-nov-30/?source=iedfolrf0000001',
		tickers: ['RIVN', 'TSLA', 'LCID'],
		image_url:
			'https://g.foolcdn.com/editorial/images/797492/gettyimages-2047165268-1200x800-5b2df79.jpg',
		description:
			'Rivian Automotive (RIVN) has been a volatile stock since its IPO, but its recent correction has made it too cheap to ignore. The company is poised to achieve positive gross margins this quarter, which could be a major catalyst for the stock. Aggressive growth investors should consider Rivian, but be prepared for potential volatility.',
		keywords: [
			'Rivian Automotive',
			'electric vehicles',
			'gross margins',
			'valuation',
		],
		insights: [
			{
				ticker: 'RIVN',
				sentiment: 'positive',
				sentiment_reasoning:
					'The article suggests that Rivian Automotive is undervalued compared to its peers and is poised to achieve positive gross margins in the near future, which could be a significant catalyst for the stock price.',
			},
			{
				ticker: 'TSLA',
				sentiment: 'positive',
				sentiment_reasoning:
					'The article mentions that Tesla has achieved positive gross margins for years, which is a positive indicator for the EV industry.',
			},
			{
				ticker: 'LCID',
				sentiment: 'neutral',
				sentiment_reasoning:
					"The article compares Rivian's valuation to Lucid Group, but does not provide a strong opinion on Lucid Group's prospects.",
			},
		],
	},
	{
		id: '8ecc7934f03aedaa842efb535e4edf06f2e43576823eef60a8127b480ab28428',
		publisher: {
			name: 'The Motley Fool',
			homepage_url: 'https://www.fool.com/',
			logo_url:
				'https://s3.polygon.io/public/assets/news/logos/themotleyfool.svg',
			favicon_url:
				'https://s3.polygon.io/public/assets/news/favicons/themotleyfool.ico',
		},
		title: 'Should You Buy Archer Aviation Stock Below $5?',
		author: 'Brett Schafer',
		published_utc: '2024-11-24T23:06:00Z',
		article_url:
			'https://www.fool.com/investing/2024/11/24/should-you-buy-archer-aviation-stock-below-5/?source=iedfolrf0000001',
		tickers: ['ACHR', 'ACHR.WS', 'TSLA', 'UBER', 'NKLA'],
		image_url: 'https://g.foolcdn.com/editorial/images/798259/helicopter.jpg',
		description:
			'Archer Aviation is developing electric vertical take-off and landing (eVTOL) taxis to address urban transportation issues, but the company faces significant regulatory hurdles and is burning through cash without generating revenue. The author recommends avoiding the stock for now.',
		keywords: [
			'Archer Aviation',
			'eVTOL',
			'electric vehicles',
			'transportation',
			'urban mobility',
		],
		insights: [
			{
				ticker: 'ACHR',
				sentiment: 'negative',
				sentiment_reasoning:
					'The article highlights several concerns about Archer Aviation, including the lack of regulatory approvals, high operating losses, and cash burn without any revenue generation. The author concludes that it is too risky to invest in the stock at this stage.',
			},
			{
				ticker: 'ACHR.WS',
				sentiment: 'negative',
				sentiment_reasoning:
					'The article highlights several concerns about Archer Aviation, including the lack of regulatory approvals, high operating losses, and cash burn without any revenue generation. The author concludes that it is too risky to invest in the stock at this stage.',
			},
			{
				ticker: 'TSLA',
				sentiment: 'positive',
				sentiment_reasoning:
					'The article mentions Tesla as an example of a successful disrupter in the transportation sector, suggesting that the company has made millionaires out of its shareholders.',
			},
			{
				ticker: 'UBER',
				sentiment: 'positive',
				sentiment_reasoning:
					'The article cites Uber as another example of a transportation disrupter, indicating that the company has provided new ways for people to get around.',
			},
			{
				ticker: 'NKLA',
				sentiment: 'negative',
				sentiment_reasoning:
					'The article mentions Nikola, a hydrogen fuel cell truck company, as an example of a disrupter that has lost shareholders a lot of money.',
			},
		],
	},
	{
		id: '6368817576e87c55edc22fa1ebf87881bbd3696c92211c6d6cebdfbe0431e873',
		publisher: {
			name: 'The Motley Fool',
			homepage_url: 'https://www.fool.com/',
			logo_url:
				'https://s3.polygon.io/public/assets/news/logos/themotleyfool.svg',
			favicon_url:
				'https://s3.polygon.io/public/assets/news/favicons/themotleyfool.ico',
		},
		title:
			'1 Magnificent Stock Up Almost 700% in 9 Years: Is It a No-Brainer Buying Opportunity Right Now?',
		author: 'The Motley Fool',
		published_utc: '2024-11-23T08:36:00Z',
		article_url:
			'https://www.fool.com/investing/2024/11/23/magnificent-stock-up-700-9-years-no-brainer-buy/?source=iedfolrf0000001',
		tickers: ['RACE', 'TSLA'],
		image_url:
			'https://g.foolcdn.com/editorial/images/797794/sports-car-driving-road-near-mountains.jpg',
		description:
			"Ferrari's stock has soared by 691% since its IPO in 2015, driven by its strong brand, pricing power, and profitability. However, the stock is currently trading at a steep valuation, and the author suggests waiting for a sizable pullback before adding it to one's portfolio.",
		keywords: [
			'Ferrari',
			'luxury brand',
			'pricing power',
			'profitability',
			'valuation',
		],
		insights: [
			{
				ticker: 'RACE',
				sentiment: 'positive',
				sentiment_reasoning:
					"The article highlights Ferrari's impressive financial performance, strong brand, and pricing power, which have contributed to the stock's nearly 700% gain since its IPO. The author views Ferrari as a high-quality enterprise, though the current valuation is considered steep.",
			},
			{
				ticker: 'TSLA',
				sentiment: 'neutral',
				sentiment_reasoning:
					"The article compares Ferrari's profitability to that of Tesla, but does not provide any specific commentary on Tesla's performance or outlook.",
			},
		],
	},
	{
		id: 'f26568a65ddd80c64bb94a8f3018ebe02f03c4d2e1a12faf47d614767ff4b3b4',
		publisher: {
			name: 'Investing.com',
			homepage_url: 'https://www.investing.com/',
			logo_url: 'https://s3.polygon.io/public/assets/news/logos/investing.png',
			favicon_url:
				'https://s3.polygon.io/public/assets/news/favicons/investing.ico',
		},
		title: 'Is Magnificent 7 Still a Good Bet for 2025?',
		author: 'The Tokenist',
		published_utc: '2024-11-22T20:17:00Z',
		article_url:
			'https://www.investing.com/analysis/is-magnificent-7-still-a-good-bet-for-2025-200654504',
		tickers: ['MSFT', 'GOOG', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'AAPL'],
		amp_url:
			'https://m.investing.com/analysis/is-magnificent-7-still-a-good-bet-for-2025-200654504?ampMode=1',
		image_url:
			'https://i-invdn-com.investing.com/redesign/images/seo/investingcom_analysis_og.jpg',
		description:
			"The article discusses the performance of the 'Magnificent Seven' tech stocks (MSFT, GOOGL, AAPL, AMZN, NVDA, TSLA, META) in 2024 and their outlook for 2025. While some stocks like Nvidia have performed well, others like Apple, Alphabet, and Microsoft have lagged the S&P 500 index.",
		keywords: [
			'Magnificent Seven',
			'tech stocks',
			'S&P 500',
			'performance',
			'outlook',
		],
		insights: [
			{
				ticker: 'MSFT',
				sentiment: 'positive',
				sentiment_reasoning:
					'Microsoft has been successful with its Azure cloud platform and is integrating AI services across its products, which is expected to drive growth.',
			},
			{
				ticker: 'GOOG',
				sentiment: 'neutral',
				sentiment_reasoning:
					"Alphabet's entrenched market position enables it to continue beating earnings estimates, but it may face antitrust scrutiny under the new administration.",
			},
			{
				ticker: 'GOOGL',
				sentiment: 'neutral',
				sentiment_reasoning:
					"Alphabet's entrenched market position enables it to continue beating earnings estimates, but it may face antitrust scrutiny under the new administration.",
			},
			{
				ticker: 'AMZN',
				sentiment: 'positive',
				sentiment_reasoning:
					'Amazon is expected to receive a boost during the holiday season, and its tri-core business model (e-commerce, AWS, advertising) continues to perform well.',
			},
			{
				ticker: 'META',
				sentiment: 'positive',
				sentiment_reasoning:
					'Meta Platforms has reported record revenue and is expected to benefit from its Llama AI models, which could be used by government agencies and national security contractors.',
			},
			{
				ticker: 'NVDA',
				sentiment: 'positive',
				sentiment_reasoning:
					'Nvidia has been the standout performer among the Magnificent Seven, as it continues to dominate the AI chip market and benefit from the growing demand for video-generated content.',
			},
			{
				ticker: 'TSLA',
				sentiment: 'neutral',
				sentiment_reasoning:
					"Tesla's performance has been mixed, with resources being diverted to the Cybertruck project rather than a cheaper EV model. However, the potential of its FSD and robotaxi features could provide a boost in 2025.",
			},
			{
				ticker: 'AAPL',
				sentiment: 'negative',
				sentiment_reasoning:
					"Apple's global expansion has been threatened by Chinese phone manufacturers, and there is little room for further expansion. The company's high-margin products like the Apple Vision Pro have also underperformed.",
			},
		],
	},
	{
		id: '92a4d82c69bc812f002ac8dab9eac80834b6282272594c906265d5e38a58fa22',
		publisher: {
			name: 'The Motley Fool',
			homepage_url: 'https://www.fool.com/',
			logo_url:
				'https://s3.polygon.io/public/assets/news/logos/themotleyfool.svg',
			favicon_url:
				'https://s3.polygon.io/public/assets/news/favicons/themotleyfool.ico',
		},
		title: 'Why Tesla Stock Ended the Week on a High Note',
		author: 'Howard Smith',
		published_utc: '2024-11-22T19:29:58Z',
		article_url:
			'https://www.fool.com/investing/2024/11/22/why-tesla-stock-ended-the-week-on-a-high-note/?source=iedfolrf0000001',
		tickers: ['TSLA'],
		image_url:
			'https://g.foolcdn.com/editorial/images/798788/model-3-performance_47.jpg',
		description:
			"Tesla's stock has surged over 60% in the last month, driven by a rebound in European electric vehicle (EV) sales. The recent increase in European EV registrations, particularly for Tesla, is a positive sign for the company as it prepares to report global sales for 2024.",
		keywords: ['Tesla', 'European EV sales', 'electric vehicles'],
		insights: [
			{
				ticker: 'TSLA',
				sentiment: 'positive',
				sentiment_reasoning:
					"The article reports that Tesla's stock has surged over 60% in the last month, driven by a rebound in European EV sales. The company's sales in Europe have also been increasing over the last two months, indicating strong demand for its vehicles.",
			},
		],
	},
	{
		id: 'd96e3e14a624bdcdc730ab4a9c2ae40703c31b64bfd5a25bf980f20d864cd917',
		publisher: {
			name: 'GlobeNewswire Inc.',
			homepage_url: 'https://www.globenewswire.com',
			logo_url:
				'https://s3.polygon.io/public/assets/news/logos/globenewswire.svg',
			favicon_url:
				'https://s3.polygon.io/public/assets/news/favicons/globenewswire.ico',
		},
		title:
			'Global Advanced Li-ion and Beyond Batteries Markets 2025-2035: R&D Advances in Solid-State and Lithium-Metal Technologies Redefine Energy Density Goals',
		author: 'Researchandmarkets.Com',
		published_utc: '2024-11-22T09:57:00Z',
		article_url:
			'https://www.globenewswire.com/news-release/2024/11/22/2985778/28124/en/Global-Advanced-Li-ion-and-Beyond-Batteries-Markets-2025-2035-R-D-Advances-in-Solid-State-and-Lithium-Metal-Technologies-Redefine-Energy-Density-Goals.html',
		tickers: ['TSLA', 'BYDDY', 'QS', 'PCRHY'],
		image_url:
			'https://ml.globenewswire.com/Resource/Download/908fb457-7f8e-4a08-9081-5565e3dfb3d7',
		description:
			'The lithium-ion battery market is experiencing rapid growth, driven by increasing demand for energy storage solutions. However, the industry is also witnessing the emergence of innovative technologies that go beyond traditional lithium-ion chemistries, such as lithium-metal and lithium-sulfur batteries, promising even greater advancements in energy storage capabilities.',
		keywords: [
			'lithium-ion batteries',
			'energy storage',
			'lithium-metal batteries',
			'lithium-sulfur batteries',
			'advanced battery technologies',
		],
		insights: [
			{
				ticker: 'TSLA',
				sentiment: 'positive',
				sentiment_reasoning:
					'Tesla is mentioned as one of the well-established players in the lithium-ion battery market, indicating its strong position in the industry.',
			},
			{
				ticker: 'BYDDY',
				sentiment: 'positive',
				sentiment_reasoning:
					'BYD is mentioned as one of the well-established players in the lithium-ion battery market, indicating its strong position in the industry.',
			},
			{
				ticker: 'QS',
				sentiment: 'positive',
				sentiment_reasoning:
					'QuantumScape is mentioned as a company at the forefront of developing lithium-metal battery technology, indicating its innovative capabilities.',
			},
			{
				ticker: 'PCRHY',
				sentiment: 'positive',
				sentiment_reasoning:
					'Panasonic is mentioned as one of the well-established players in the lithium-ion battery market, indicating its strong position in the industry.',
			},
		],
	},
	{
		id: 'ab7d54c2914829c272efe7e2cf9ae709f9749d3feaaf3c88fab1e65d8ceaffa1',
		publisher: {
			name: 'The Motley Fool',
			homepage_url: 'https://www.fool.com/',
			logo_url:
				'https://s3.polygon.io/public/assets/news/logos/themotleyfool.svg',
			favicon_url:
				'https://s3.polygon.io/public/assets/news/favicons/themotleyfool.ico',
		},
		title:
			'Billionaire Ken Griffin Increased His Position in Tesla Stock By 395%. Should You Buy Tesla During Its Post-Election Surge?',
		author: 'The Motley Fool',
		published_utc: '2024-11-20T23:22:00Z',
		article_url:
			'https://www.fool.com/investing/2024/11/20/billionaire-ken-griffin-increased-his-position-in/?source=iedfolrf0000001',
		tickers: ['TSLA'],
		image_url:
			'https://g.foolcdn.com/editorial/images/798227/tesla-ev-electric-vehicle-charging-station-2.jpg',
		description:
			"Billionaire Ken Griffin's hedge fund Citadel Advisors increased its Tesla (TSLA) position by 395% in the third quarter, potentially due to the belief that Tesla could benefit from policy changes under a Trump administration. However, the article cautions against chasing Tesla's current hype-driven valuation.",
		keywords: [
			'Tesla',
			'Citadel Advisors',
			'Ken Griffin',
			'Trump administration',
		],
		insights: [
			{
				ticker: 'TSLA',
				sentiment: 'neutral',
				sentiment_reasoning:
					"The article cautions against chasing Tesla's current hype-driven valuation, despite the potential benefits the company could see under a Trump administration.",
			},
		],
	},
	{
		id: 'f7ffb3a5b53ba07759871afeb178f2e9f4c4cfb3cf5997bad2658dd59d8813c4',
		publisher: {
			name: 'The Motley Fool',
			homepage_url: 'https://www.fool.com/',
			logo_url:
				'https://s3.polygon.io/public/assets/news/logos/themotleyfool.svg',
			favicon_url:
				'https://s3.polygon.io/public/assets/news/favicons/themotleyfool.ico',
		},
		title: "Prediction: General Motors Will Beat the Market. Here's Why",
		author: 'Travis Hoium',
		published_utc: '2024-11-20T12:30:00Z',
		article_url:
			'https://www.fool.com/investing/2024/11/20/prediction-general-motors-will-beat-the-market-her/?source=iedfolrf0000001',
		tickers: ['GM', 'TSLA'],
		image_url:
			'https://g.foolcdn.com/editorial/images/798377/copy-of-tmf-yt-thumbnails-4.png',
		description:
			"General Motors (GM) is a leader in the lucrative truck and SUV segments, and is growing in electric vehicles (EVs) and autonomy. With a valuation that's too good to pass up, it could be a rocket stock.",
		keywords: ['General Motors', 'electric vehicles', 'autonomy'],
		insights: [
			{
				ticker: 'GM',
				sentiment: 'positive',
				sentiment_reasoning:
					"The article highlights that General Motors is a leader in the most lucrative segments of the auto business, trucks and SUVs, and is growing in both EVs and autonomy. Additionally, the article suggests that the company's valuation is too good to pass up, indicating it could be a 'rocket stock'.",
			},
			{
				ticker: 'TSLA',
				sentiment: 'neutral',
				sentiment_reasoning:
					'The article mentions that The Motley Fool has positions in Tesla, but does not provide any specific commentary on the company.',
			},
		],
	},
	{
		id: 'd5cfec7fcf5253feba6b0c635b9f8ffc02d5cee16521d1cb8636dd69c624737b',
		publisher: {
			name: 'The Motley Fool',
			homepage_url: 'https://www.fool.com/',
			logo_url:
				'https://s3.polygon.io/public/assets/news/logos/themotleyfool.svg',
			favicon_url:
				'https://s3.polygon.io/public/assets/news/favicons/themotleyfool.ico',
		},
		title: 'Where Will Lucid Stock Be in 1 Year?',
		author: 'Will Ebiefung',
		published_utc: '2024-11-20T11:45:00Z',
		article_url:
			'https://www.fool.com/investing/2024/11/20/where-will-lucid-stock-be-in-1-year/?source=iedfolrf0000001',
		tickers: ['LCID', 'TSLA', 'F', 'FpB', 'FpC', 'FpD'],
		image_url:
			'https://g.foolcdn.com/editorial/images/798112/gettyimages-1441154416.jpg',
		description:
			"Lucid Group, an electric vehicle maker, faces an uncertain future due to its high cash burn and the need for constant equity dilution. The company's prospects may be impacted by potential policy changes under the Trump administration, which could reduce government support for electric vehicles.",
		keywords: [
			'Lucid Group',
			'electric vehicles',
			'Trump administration',
			'cash burn',
			'equity dilution',
		],
		insights: [
			{
				ticker: 'LCID',
				sentiment: 'negative',
				sentiment_reasoning:
					"The article highlights Lucid Group's deteriorating fundamentals, including high cash burn and the need for constant equity dilution, which could negatively impact the company's future prospects.",
			},
			{
				ticker: 'TSLA',
				sentiment: 'positive',
				sentiment_reasoning:
					"The article contrasts Lucid Group's performance with that of industry leader Tesla, which has seen its stock price increase since the election of President-elect Trump.",
			},
			{
				ticker: 'F',
				sentiment: 'neutral',
				sentiment_reasoning:
					"The article mentions Ford Motor Company's losses in its electric vehicle segment, which could benefit smaller pure-play companies like Lucid if government pressure to transition to EVs eases.",
			},
			{
				ticker: 'FpB',
				sentiment: 'neutral',
				sentiment_reasoning:
					"The article mentions Ford Motor Company's losses in its electric vehicle segment, which could benefit smaller pure-play companies like Lucid if government pressure to transition to EVs eases.",
			},
			{
				ticker: 'FpC',
				sentiment: 'neutral',
				sentiment_reasoning:
					"The article mentions Ford Motor Company's losses in its electric vehicle segment, which could benefit smaller pure-play companies like Lucid if government pressure to transition to EVs eases.",
			},
			{
				ticker: 'FpD',
				sentiment: 'neutral',
				sentiment_reasoning:
					"The article mentions Ford Motor Company's losses in its electric vehicle segment, which could benefit smaller pure-play companies like Lucid if government pressure to transition to EVs eases.",
			},
		],
	},
	{
		id: 'c3dfbecefc5b0800d464b87743aa538b4a9ed40d74f74cf837a8203134c21f48',
		publisher: {
			name: 'Benzinga',
			homepage_url: 'https://www.benzinga.com/',
			logo_url: 'https://s3.polygon.io/public/assets/news/logos/benzinga.svg',
			favicon_url:
				'https://s3.polygon.io/public/assets/news/favicons/benzinga.ico',
		},
		title:
			'Cathie Wood Sounds Alarm On US Auto Loans As 90-Day Delinquency Rates Surpass 2009 Levels',
		author: 'Kaustubh Bagalkote',
		published_utc: '2024-11-20T06:03:08Z',
		article_url:
			'https://www.benzinga.com/markets/equities/24/11/42080723/cathie-wood-sounds-alarm-on-us-auto-loans-as-90-day-delinquency-rates-surpass-2009-levels',
		tickers: ['F', 'FpB', 'FpC', 'FpD', 'ARKK', 'TSLA', 'NSANY', 'STLA'],
		image_url:
			'https://cdn.benzinga.com/files/images/story/2024/11/20/Cathie-Wood-Keeps-Betting-On-Amazons-Hau.jpeg?width=1200&height=800&fit=crop',
		description:
			'Cathie Wood, CEO of ARK Invest, has raised concerns about the rising auto loan delinquency rates in the US, which have now exceeded the levels seen during the 2009 financial crisis. This trend coincides with significant price cuts across the auto industry, but investors are still aggressively pursuing auto loan-backed bonds.',
		keywords: [
			'auto loans',
			'delinquency rates',
			'auto industry',
			'auto-backed securities',
		],
		insights: [
			{
				ticker: 'F',
				sentiment: 'negative',
				sentiment_reasoning:
					'The article mentions that Ford Motor has cut the price of its Mustang Mach-E by up to $8,100, indicating challenges in the auto industry.',
			},
			{
				ticker: 'FpB',
				sentiment: 'negative',
				sentiment_reasoning:
					'The article mentions that Ford Motor has cut the price of its Mustang Mach-E by up to $8,100, indicating challenges in the auto industry.',
			},
			{
				ticker: 'FpC',
				sentiment: 'negative',
				sentiment_reasoning:
					'The article mentions that Ford Motor has cut the price of its Mustang Mach-E by up to $8,100, indicating challenges in the auto industry.',
			},
			{
				ticker: 'FpD',
				sentiment: 'negative',
				sentiment_reasoning:
					'The article mentions that Ford Motor has cut the price of its Mustang Mach-E by up to $8,100, indicating challenges in the auto industry.',
			},
			{
				ticker: 'ARKK',
				sentiment: 'neutral',
				sentiment_reasoning:
					'The article focuses on the concerns raised by Cathie Wood, the CEO of ARK Invest, which manages the ARK Innovation ETF, about the auto loan delinquency rates.',
			},
			{
				ticker: 'TSLA',
				sentiment: 'negative',
				sentiment_reasoning:
					'The article mentions that Tesla has reduced the prices of its Model Y, Model X, and Model S by $2,000, suggesting challenges in the auto industry.',
			},
			{
				ticker: 'NSANY',
				sentiment: 'negative',
				sentiment_reasoning:
					'The article states that Nissan has slashed up to $6,000 off its Ariya SUV, indicating pricing pressures in the auto industry.',
			},
			{
				ticker: 'STLA',
				sentiment: 'negative',
				sentiment_reasoning:
					'The article mentions that Stellantis NV has introduced discounts on Jeep Wranglers and Grand Cherokees, suggesting challenges in the auto industry.',
			},
		],
	},
	{
		id: 'fefdec58cee64ea1017ddc76ca0c1543d23d24756a9a72a658c78f467cf1e779',
		publisher: {
			name: 'The Motley Fool',
			homepage_url: 'https://www.fool.com/',
			logo_url:
				'https://s3.polygon.io/public/assets/news/logos/themotleyfool.svg',
			favicon_url:
				'https://s3.polygon.io/public/assets/news/favicons/themotleyfool.ico',
		},
		title: 'The Smartest Megacap Growth ETF to Buy With $500 Right Now',
		author: 'Adria Cimino',
		published_utc: '2024-11-19T09:45:00Z',
		article_url:
			'https://www.fool.com/investing/2024/11/19/the-smartest-mega-cap-growth-etf-to-buy-with-500/?source=iedfolrf0000001',
		tickers: ['MGK', 'AAPL', 'NVDA', 'MSFT', 'LLY', 'TSLA'],
		image_url:
			'https://g.foolcdn.com/editorial/images/798093/getty-happy-colleagues.jpg',
		description:
			'The Vanguard Mega Cap Growth ETF (MGK) has outperformed the S&P 500 and Nasdaq Composite over the last 5 years, hitting an all-time high. The ETF provides exposure to top growth stocks, including technology, pharma, and electric vehicle companies.',
		keywords: [
			'Vanguard Mega Cap Growth ETF',
			'growth stocks',
			'technology',
			'pharma',
			'electric vehicles',
		],
		insights: [
			{
				ticker: 'MGK',
				sentiment: 'positive',
				sentiment_reasoning:
					'The ETF has outperformed the broader market over the long term and recently hit an all-time high, indicating strong performance.',
			},
			{
				ticker: 'AAPL',
				sentiment: 'positive',
				sentiment_reasoning:
					'Apple is a top holding in the Vanguard Mega Cap Growth ETF, reflecting its status as a leading growth stock.',
			},
			{
				ticker: 'NVDA',
				sentiment: 'positive',
				sentiment_reasoning:
					'Nvidia is a top holding in the Vanguard Mega Cap Growth ETF, reflecting its position as a prominent growth stock in the technology sector.',
			},
			{
				ticker: 'MSFT',
				sentiment: 'positive',
				sentiment_reasoning:
					'Microsoft is a top holding in the Vanguard Mega Cap Growth ETF, reflecting its status as a leading growth stock.',
			},
			{
				ticker: 'LLY',
				sentiment: 'positive',
				sentiment_reasoning:
					"Eli Lilly is a heavily weighted stock in the Vanguard Mega Cap Growth ETF, indicating the fund's exposure to growth opportunities in the pharmaceutical industry.",
			},
			{
				ticker: 'TSLA',
				sentiment: 'positive',
				sentiment_reasoning:
					"Tesla is a significant holding in the Vanguard Mega Cap Growth ETF, reflecting the fund's exposure to growth in the electric vehicle industry.",
			},
		],
	},
	{
		id: 'ab0a60a8561552a11c93ea90c609aaa38de509202e773034c523766200aeafe5',
		publisher: {
			name: 'GlobeNewswire Inc.',
			homepage_url: 'https://www.globenewswire.com',
			logo_url:
				'https://s3.polygon.io/public/assets/news/logos/globenewswire.svg',
			favicon_url:
				'https://s3.polygon.io/public/assets/news/favicons/globenewswire.ico',
		},
		title: 'Purpose Investments Inc. annonce les distributions d’novembre 2024',
		author: 'N/A',
		published_utc: '2024-11-18T23:56:00Z',
		article_url:
			'https://www.globenewswire.com/news-release/2024/11/18/2983212/0/fr/Purpose-Investments-Inc-annonce-les-distributions-d-novembre-2024.html',
		tickers: [
			'AAPL',
			'MSFT',
			'AMD',
			'AMZN',
			'GOOG',
			'GOOGL',
			'META',
			'NVDA',
			'TSLA',
			'BRK.A',
			'BRK.B',
		],
		image_url:
			'https://ml.globenewswire.com/Resource/Download/a28192cb-6294-4424-8c24-646fee2c81cd',
		description:
			'Purpose Investments announced the November 2024 distributions for its ETFs and closed-end funds. The distributions will be paid on December 3, 2024, with the ex-distribution date being November 27, 2024 for the ETFs and November 29, 2024 for the closed-end funds.',
		keywords: [
			'Purpose Investments',
			'ETFs',
			'Closed-End Funds',
			'Distributions',
		],
		insights: [
			{
				ticker: 'AAPL',
				sentiment: 'positive',
				sentiment_reasoning:
					'The article mentions a monthly distribution for the Purpose ETF that tracks the Apple stock, indicating a positive sentiment towards the company.',
			},
			{
				ticker: 'MSFT',
				sentiment: 'positive',
				sentiment_reasoning:
					'The article mentions a monthly distribution for the Purpose ETF that tracks the Microsoft stock, indicating a positive sentiment towards the company.',
			},
			{
				ticker: 'AMD',
				sentiment: 'positive',
				sentiment_reasoning:
					'The article mentions a monthly distribution for the Purpose ETF that tracks the AMD stock, indicating a positive sentiment towards the company.',
			},
			{
				ticker: 'AMZN',
				sentiment: 'positive',
				sentiment_reasoning:
					'The article mentions a monthly distribution for the Purpose ETF that tracks the Amazon stock, indicating a positive sentiment towards the company.',
			},
			{
				ticker: 'GOOG',
				sentiment: 'positive',
				sentiment_reasoning:
					'The article mentions a monthly distribution for the Purpose ETF that tracks the Alphabet (Google) stock, indicating a positive sentiment towards the company.',
			},
			{
				ticker: 'GOOGL',
				sentiment: 'positive',
				sentiment_reasoning:
					'The article mentions a monthly distribution for the Purpose ETF that tracks the Alphabet (Google) stock, indicating a positive sentiment towards the company.',
			},
			{
				ticker: 'META',
				sentiment: 'positive',
				sentiment_reasoning:
					'The article mentions a monthly distribution for the Purpose ETF that tracks the Meta (Facebook) stock, indicating a positive sentiment towards the company.',
			},
			{
				ticker: 'NVDA',
				sentiment: 'positive',
				sentiment_reasoning:
					'The article mentions a monthly distribution for the Purpose ETF that tracks the NVIDIA stock, indicating a positive sentiment towards the company.',
			},
			{
				ticker: 'TSLA',
				sentiment: 'positive',
				sentiment_reasoning:
					'The article mentions a monthly distribution for the Purpose ETF that tracks the Tesla stock, indicating a positive sentiment towards the company.',
			},
			{
				ticker: 'BRK.A',
				sentiment: 'positive',
				sentiment_reasoning:
					'The article mentions a monthly distribution for the Purpose ETF that tracks the Berkshire Hathaway stock, indicating a positive sentiment towards the company.',
			},
			{
				ticker: 'BRK.B',
				sentiment: 'positive',
				sentiment_reasoning:
					'The article mentions a monthly distribution for the Purpose ETF that tracks the Berkshire Hathaway stock, indicating a positive sentiment towards the company.',
			},
		],
	},
	{
		id: '0c8af3fe9b8d390e412e4f1280b8af5aa328dfdfd872bc0fec91c917cd7776d3',
		publisher: {
			name: 'The Motley Fool',
			homepage_url: 'https://www.fool.com/',
			logo_url:
				'https://s3.polygon.io/public/assets/news/logos/themotleyfool.svg',
			favicon_url:
				'https://s3.polygon.io/public/assets/news/favicons/themotleyfool.ico',
		},
		title: 'Why Electric Vehicle Stocks Were on Fire on Monday',
		author: 'Travis Hoium',
		published_utc: '2024-11-18T22:04:43Z',
		article_url:
			'https://www.fool.com/investing/2024/11/18/why-electric-vehicle-stocks-were-on-fire-on-monday/?source=iedfolrf0000001',
		tickers: ['LCID', 'RIVN', 'TSLA', 'EVGO', 'EVGOW'],
		image_url:
			'https://g.foolcdn.com/editorial/images/798246/ev-being-charged-at-sunset.jpg',
		description:
			'The article discusses the uncertainty surrounding the EV industry under the next administration, with potential changes in regulations and subsidies. It highlights the challenges faced by EV companies like Lucid, Rivian, and Tesla in achieving profitability, even with the possibility of autonomous driving advancements.',
		keywords: [
			'electric vehicles',
			'autonomous driving',
			'regulations',
			'subsidies',
			'profitability',
		],
		insights: [
			{
				ticker: 'LCID',
				sentiment: 'neutral',
				sentiment_reasoning:
					"The article notes that Lucid's stock jumped initially on the news of potential regulatory changes, but also mentions that the company has not shown the ability to generate even a gross profit on its production, and the path to profitability is not clear.",
			},
			{
				ticker: 'RIVN',
				sentiment: 'neutral',
				sentiment_reasoning:
					'Similar to Lucid, the article states that Rivian has not shown the ability to generate even a gross profit on its production, and the path to profitability is not clear.',
			},
			{
				ticker: 'TSLA',
				sentiment: 'neutral',
				sentiment_reasoning:
					"The article discusses Tesla's efforts to push forward with its FSD software, but also notes the piecemeal nature of regulation in states across the country, which could be a challenge for the company.",
			},
			{
				ticker: 'EVGO',
				sentiment: 'positive',
				sentiment_reasoning:
					"The article mentions that EVgo's stock jumped 15.8% near the open on the news of potential regulatory changes, indicating a positive sentiment.",
			},
			{
				ticker: 'EVGOW',
				sentiment: 'positive',
				sentiment_reasoning:
					"The article mentions that EVgo's stock jumped 15.8% near the open on the news of potential regulatory changes, indicating a positive sentiment.",
			},
		],
	},
	{
		id: '9415e7828eac2d1395b3e3efda5fb82cda1345580656832c70b43e0079fb325e',
		publisher: {
			name: 'The Motley Fool',
			homepage_url: 'https://www.fool.com/',
			logo_url:
				'https://s3.polygon.io/public/assets/news/logos/themotleyfool.svg',
			favicon_url:
				'https://s3.polygon.io/public/assets/news/favicons/themotleyfool.ico',
		},
		title:
			"If You Bought 1 Share of Tesla Stock at Its IPO, Here's How Many Shares You Would Own Now",
		author: 'The Motley Fool',
		published_utc: '2024-11-18T10:09:00Z',
		article_url:
			'https://www.fool.com/investing/2024/11/18/if-bought-1-share-tesla-stock-ipo-today/?source=iedfolrf0000001',
		tickers: ['TSLA'],
		image_url:
			'https://g.foolcdn.com/editorial/images/797939/tesla-gigafactory-in-shanghai-with-tesla-logo.png',
		description:
			"If an investor had bought one share of Tesla's IPO at $17 per share, they would now own 15 shares worth $4,815 after the company's stock splits, a 283-fold return. Tesla has defied the odds by becoming a consistently profitable automaker and dominating the electric vehicle market in the U.S.",
		keywords: [
			'Tesla',
			'electric vehicles',
			'autonomous vehicles',
			'stock splits',
		],
		insights: [
			{
				ticker: 'TSLA',
				sentiment: 'positive',
				sentiment_reasoning:
					'Tesla has become a consistently profitable automaker and has dominated the electric vehicle market in the U.S., leading to significant gains for its early investors.',
			},
		],
	},
	{
		id: 'f56aa696e72b69c6ccbfb27eeacf402bf68ef5f7c4d16fb64b7ecb75f8718588',
		publisher: {
			name: 'The Motley Fool',
			homepage_url: 'https://www.fool.com/',
			logo_url:
				'https://s3.polygon.io/public/assets/news/logos/themotleyfool.svg',
			favicon_url:
				'https://s3.polygon.io/public/assets/news/favicons/themotleyfool.ico',
		},
		title:
			'Will Nvidia Soar After Nov. 20? The Evidence is Piling up and it Says This.',
		author: 'Adria Cimino',
		published_utc: '2024-11-18T09:05:00Z',
		article_url:
			'https://www.fool.com/investing/2024/11/18/will-nvidia-soar-after-nov-20-evidence-says-this/?source=iedfolrf0000001',
		tickers: ['NVDA', 'TSM', 'ORCL', 'TSLA'],
		image_url:
			'https://g.foolcdn.com/editorial/images/797831/investor-smiling-phone-at-home.jpg',
		description:
			"Nvidia, a leading AI chip maker, is set to report its Q3 earnings on Nov. 20. The company has a strong track record of beating expectations, and demand for its new Blackwell platform is reportedly 'insane'. While a lower growth figure may disappoint some investors, the overall evidence suggests Nvidia's stock could soar after the earnings report.",
		keywords: [
			'Nvidia',
			'AI chips',
			'earnings',
			'Blackwell platform',
			'stock performance',
		],
		insights: [
			{
				ticker: 'NVDA',
				sentiment: 'positive',
				sentiment_reasoning:
					"Nvidia has a strong track record of beating earnings expectations, and demand for its new Blackwell platform is reportedly very high. The company's market leadership, financial strength, and ongoing innovation make it a promising long-term investment in the AI chip market.",
			},
			{
				ticker: 'TSM',
				sentiment: 'positive',
				sentiment_reasoning:
					"Taiwan Semiconductor Manufacturing, the company that manufactures Nvidia's chips, reported double-digit revenue growth and spoke of high demand from its customers, which suggests positive news for Nvidia's earnings report.",
			},
			{
				ticker: 'ORCL',
				sentiment: 'positive',
				sentiment_reasoning:
					"Oracle co-founder Larry Ellison says he and Tesla CEO Elon Musk met with Nvidia CEO Jensen Huang and 'begged' him for more GPUs, indicating strong demand for Nvidia's products.",
			},
			{
				ticker: 'TSLA',
				sentiment: 'positive',
				sentiment_reasoning:
					"Oracle co-founder Larry Ellison says he and Tesla CEO Elon Musk met with Nvidia CEO Jensen Huang and 'begged' him for more GPUs, indicating strong demand for Nvidia's products.",
			},
		],
	},
	{
		id: '8fe31c99eef3be2f6670a7e1e71c503dc4909f7212e01520186ae9446da2d0b4',
		publisher: {
			name: 'The Motley Fool',
			homepage_url: 'https://www.fool.com/',
			logo_url:
				'https://s3.polygon.io/public/assets/news/logos/themotleyfool.svg',
			favicon_url:
				'https://s3.polygon.io/public/assets/news/favicons/themotleyfool.ico',
		},
		title: 'Is Nvidia Still a Millionaire-Maker Stock?',
		author: 'Will Ebiefung',
		published_utc: '2024-11-17T11:45:00Z',
		article_url:
			'https://www.fool.com/investing/2024/11/17/is-nvidia-still-a-millionaire-maker-stock/?source=iedfolrf0000001',
		tickers: ['NVDA', 'META', 'TSLA'],
		image_url:
			'https://g.foolcdn.com/editorial/images/797813/gettyimages-1423544107.jpg',
		description:
			"Nvidia, the quintessential millionaire-maker stock, has seen massive growth, but its future is uncertain. While the company's AI chips have driven recent success, the sustainability of this growth is questionable, as many of Nvidia's top clients have speculative AI strategies with uncertain business models.",
		keywords: ['Nvidia', 'AI', 'Chipmaker', 'Investing'],
		insights: [
			{
				ticker: 'NVDA',
				sentiment: 'neutral',
				sentiment_reasoning:
					"The article presents a mixed outlook on Nvidia, noting that while the company has seen massive growth, its future is uncertain due to the speculative nature of its clients' AI strategies and the potential for a slowdown or crash in the AI-led growth.",
			},
			{
				ticker: 'META',
				sentiment: 'negative',
				sentiment_reasoning:
					"The article suggests that Meta Platforms, one of Nvidia's top customers, has an uncertain AI business model, similar to its previous failed Metaverse project, which could lead to a drop in chip demand.",
			},
			{
				ticker: 'TSLA',
				sentiment: 'negative',
				sentiment_reasoning:
					"The article mentions that Tesla, another Nvidia customer, is building a speculative AI project called Dojo, which CEO Elon Musk admits is a 'long shot', further contributing to the uncertainty around Nvidia's future growth.",
			},
		],
	},
	{
		id: '1ee8d1722f7ef29208bc500fdf93a39219c01bb75c6d6ea41fd15cc621174692',
		publisher: {
			name: 'The Motley Fool',
			homepage_url: 'https://www.fool.com/',
			logo_url:
				'https://s3.polygon.io/public/assets/news/logos/themotleyfool.svg',
			favicon_url:
				'https://s3.polygon.io/public/assets/news/favicons/themotleyfool.ico',
		},
		title:
			"Prediction: 3 Stocks That'll Be Worth More Than Tesla 10 Years From Now",
		author: 'Keith Speights',
		published_utc: '2024-11-17T11:42:00Z',
		article_url:
			'https://www.fool.com/investing/2024/11/17/prediction-3-stocks-thatll-be-worth-more-than-walm/?source=iedfolrf0000001',
		tickers: ['TSLA', 'BRK.A', 'BRK.B', 'AVGO', 'LLY'],
		image_url:
			'https://g.foolcdn.com/editorial/images/797838/stock-chart-in-eyeglasses.jpg',
		description:
			"The article predicts that Berkshire Hathaway, Broadcom, and Eli Lilly could be worth more than Tesla in 10 years. Berkshire Hathaway is seen as a safer, steadier bet compared to Tesla. Broadcom is expected to benefit from the growth of artificial intelligence. Eli Lilly's diabetes and obesity drugs are expected to drive strong sales growth.",
		keywords: [
			'Tesla',
			'Berkshire Hathaway',
			'Broadcom',
			'Eli Lilly',
			'electric vehicles',
			'artificial intelligence',
			'pharmaceuticals',
		],
		insights: [
			{
				ticker: 'TSLA',
				sentiment: 'neutral',
				sentiment_reasoning:
					"The article is unsure about Tesla's future performance, but predicts that the other three companies could be worth more than Tesla in 10 years.",
			},
			{
				ticker: 'BRK.A',
				sentiment: 'positive',
				sentiment_reasoning:
					'The article sees Berkshire Hathaway as a safer, steadier bet compared to Tesla, with its core businesses in insurance, energy, and railroads.',
			},
			{
				ticker: 'BRK.B',
				sentiment: 'positive',
				sentiment_reasoning:
					'The article sees Berkshire Hathaway as a safer, steadier bet compared to Tesla, with its core businesses in insurance, energy, and railroads.',
			},
			{
				ticker: 'AVGO',
				sentiment: 'positive',
				sentiment_reasoning:
					'The article expects Broadcom to benefit from the growth of artificial intelligence, with its ethernet networking equipment and custom AI accelerators.',
			},
			{
				ticker: 'LLY',
				sentiment: 'positive',
				sentiment_reasoning:
					"The article expects Eli Lilly's diabetes and obesity drugs, particularly Mounjaro and Zepbound, to drive strong sales growth and potentially make the company worth more than Tesla in 10 years.",
			},
		],
	},
];
let stockData = sampleStockData;
let news = sampleNewsData;
schedule.scheduleJob('0 0 * * *', async () => {
	todayUserCount = 0;
});
schedule.scheduleJob('1 4 * * *', async () => {
	stockData = await getPolygonIoPreviousClose();
	news = await getPolygonIoNews();
});

app.use(
	'/stock',
	(req, res, next) => {
		res.header('Access-Control-Allow-Origin', process.env.CORS_URL);
		req.stockData = stockData;
		req.news = news;
		next();
	},
	stockRoutes
);
// Socket.IO 연결 설정
io.on('connect', (socket) => {
	console.log('A user connected:', socket.id);

	currentUserCount += 1;
	todayUserCount += 1;

	const userId = socket.id;
	const currentTime = new Date().toISOString();
	// 접속 emit
	io.emit('chat_message', {
		type: 'connect',
		userId: userId,
		time: currentTime,
		message: `${socket.id}님이 입장하셨습니다.`,
	});
	// count 처리
	countController.handleCount(socket, io, currentUserCount, todayUserCount);

	// 메시지 처리
	chatController.handleMessage(socket, io);

	// 연결 종료 처리
	socket.on('disconnect', () => {
		currentUserCount -= 1;
		countController.handleCount(socket, io, currentUserCount, todayUserCount);

		// 접속 emit
		io.emit('chat_message', {
			type: 'disconnect',
			userId: userId,
			time: currentTime,
			message: `${socket.id}님이 퇴장하셨습니다.`,
		});
	});
});

// 서버 시작
const PORT = 3001;
server.listen(PORT, async () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
