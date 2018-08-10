
exports.chatPage = (req, res) => {
    res.render('chat', {title: 'Chat', store: {id: req.params.id}})
}


exports.onChatMessage = (io) => (msg) => {
    console.log('Message from user: ' + msg);
    io.emit('chat message', msg);
}

exports.onDisconnect = () => {
    console.log('User disconnected');
    
}