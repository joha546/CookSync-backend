const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message:{
        type: String,
        required: true
    },
    link:{
        type: String,
    },
    type:{
        type: String,
        enum: ['like', 'comment', 'mention', 'system', 'chat', 'collaboration', 'chef-approval', 'join-room'], default: 'system'
    },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Notification', notificationSchema);