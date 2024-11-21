module.exports = {
	handleMessage: (socket, io) => {
		socket.on('chat_message', async (data) => {
			const userId = socket.id;
			const currentTime = new Date().toISOString();

			// 메시지를 연결된 모든 클라이언트에 브로드캐스트
			io.emit('chat_message', {
				type: 'message',
				userId: userId,
				time: currentTime,
				message: data,
			});
		});
	},
};
