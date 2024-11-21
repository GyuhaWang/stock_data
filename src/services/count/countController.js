module.exports = {
	handleCount: (socket, io, currentUserCount, todayUserCount) => {
		io.emit('count', {
			current: currentUserCount,
			today: todayUserCount,
		});
	},
};
