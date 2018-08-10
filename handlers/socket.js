const socketInstance = require('socket.io');
const chatController = require('../controllers/chatController');

module.exports = (server) => {
    const io = socketInstance(server);
    io.on('connection', (socket) => {
        console.log('New user connected');
        socket.on('chat message', chatController.onChatMessage(io));
        socket.on('disconnect', chatController.onDisconnect);
    })
}