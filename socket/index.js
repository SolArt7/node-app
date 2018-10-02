const chatController = require('../controllers/chatController');

module.exports = (server) => {
	
	const io = require('socket.io').listen(server);
	io.set('origins', 'localhost:*');
	
	io.on('connection', (socket) => {
		const url = socket.handshake.headers.referer;
		const id = url.split('chat/')[1];
		if (!id) return;
		
		// Event controllers
		socket.on(`send-${id}`, chatController.onSendMessage(io, id));
		socket.on('disconnect', chatController.onDisconnect);
	});
};