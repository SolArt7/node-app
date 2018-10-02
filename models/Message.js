const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const messageSchema = new mongoose.Schema({
    store: {
        type: mongoose.Schema.ObjectId,
        ref: 'Store',
        required: 'Store ID is required'
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: 'User ID is required'
    },
    text: {
        type: String,
        required: 'Text is required'
    }
})

function autopopulate(next) {
    this.populate('user');
    next();
}

messageSchema.pre('find', autopopulate);
messageSchema.pre('findOne', autopopulate);


module.exports = mongoose.model('Message', messageSchema);