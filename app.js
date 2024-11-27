const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { clearInterval } = require('timers');

const chatController = require('./src/services/chat/chatController');
const countController = require('./src/services/count/countController');

const {
	initializeBrowser,
	closeBrowser,
	crawl,
} = require('./src/services/stock/stockService');
require('dotenv').config();
const app = express();
const server = http.createServer(app); // Express 서버로 HTTP 서버 생성
const io = new Server(server, {
	cors: {
		// origin: process.env.CORS_URL, // 허용할 클라이언트 도메인
		methods: ['GET', 'POST'], // 허용할 HTTP 메서드
		credentials: true, // 인증 정보(쿠키 등)를 포함할지 여부
	},
});

// Middleware
app.use(express.json());

// 접속자 변수
let currentUserCount = 0;
let todayUserCount = 0;

// 크롤링 데이터 변수
let crawlingIntervalId;
let ioEmitIntervalId;
const reloadInterval = 5000;
let stockText = '...';
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
		clearInterval(ioEmitIntervalId);
		// 접속 emit
		io.emit('chat_message', {
			type: 'disconnect',
			userId: userId,
			time: currentTime,
			message: `${socket.id}님이 퇴장하셨습니다.`,
		});
	});
});

// 컴퓨터 다운시 브라우저 종료 명령어
// process.on('SIGINT', async () => {
// 	if (browser) await closeBrowser();
// 	if (crawlingIntervalId) clearInterval(crawlingIntervalId);
// 	process.exit(0);
// });

// 주기적 크롤링 시작
const startCrawling = () => {
	crawlingIntervalId = setInterval(async () => {
		stockObj = await crawl();
		io.emit('stock_data', stockObj);
	}, reloadInterval);

	io.on('disconnect', () => clearInterval(crawlingIntervalId));
};

// 서버 시작
const PORT = 3001;
server.listen(PORT, async () => {
	console.log(`Server running on http://localhost:${PORT}`);
	// await initializeBrowser(); // 브라우저 초기화
	// startCrawling();
});
