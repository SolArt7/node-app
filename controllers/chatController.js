const mongoose = require('mongoose');
const Message = mongoose.model('Message');
const Store = mongoose.model('Store');


exports.chatPage = async (req, res) => {
	const store = await Store.findById(req.params.id).populate('messages');
	
	res.render('chat', {
		title: 'Chat',
		store
	})
};

// Socket controllers

exports.onSendMessage = (io, id) => async (data) => {
	// save message
	const msg = {
		text: data.message,
		store: data.storeId,
		user: data.userId
	};
	try {
		const message = new Message(msg);
		await message.save();
		io.emit(`send-${id}`, data);
		
	} catch (e) {
		console.log(e);
		io.emit(`send-${id}`, {success: false});
	}
};

exports.onDisconnect = () => {
	console.log('User disconnected');
};