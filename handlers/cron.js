const mongoose = require('mongoose');


module.exports = () => {
	setInterval(() => {
		// drop Message every 30 minutes
		
		mongoose.connection.db.dropCollection('messages', (err, res) => {
			if (err) {
				console.log('--- error dropping messages collection ---');
				console.log(err);
			}
			if (res) {
				console.log('--- messages collection dropped ---');
			}
		})
		
	}, (1000 * 60 * 30));
};