const ChatMessage = require('../models/ChatMessage');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Handle chat message send + store
module.exports = function handleChatEvents(io, socket){
    socket.on('chat-message', async({recipeId, message}) => {
        if(!message || !recipeId){
            return socket.emit('error', 'Message and recipeId are required');
        }

        try {
            const chatMsg = new ChatMessage({
                recipeId,
                userId: socket.user._id,
                message
            });

            await chatMsg.save();

            const payload ={
                message,
                by: socket.user.email,
                at: chatMsg.createdAt
            }

            // broadcast to room.
            io.to(recipeId).emit('chat-message', payload);
            console.log(`💬 Chat from ${socket.user.email} in ${recipeId}: ${message}`);

            // Detect @mentions
            const mentions = message.match(/@([a-zA-Z0-9._-]+)/g);

            if(mentions){
                const usernames = mentions.map(m => m.subString(1).toLowerCase());

                const mentionedUsers = await User.find({
                    email: {$in: usernames.map(name => `${name}@cookysync.com`)}
                });

                for(const user of mentionedUsers){
                    
                    // Avoid notifying self.
                    if(user._id.toString() === socket.user._id.toString()){
                        continue;
                    }

                    const notif = await Notification.create({
                        user: user._id,
                        message: `${socket.user.email} mentioned you in a chat`,
                        link: `/recipes/${recipeId}`,
                        type: 'mention'
                    });

                    const sockets = await io.fetchSockets();
                    sockets.forEach(sock => {
                        if(sock.user && sock.user._id.toString() === user._id.toString()){
                            sock.emit('new-notification', {
                                type: 'mention',
                                message: notif.message,
                                link: notif.link,
                                createdAt: notif.createdAt
                            });
                        }
                    })
                }
            }
        } 
        catch(error) {
            console.error('❌ Chat save failed:', error.message);
            socket.emit('error', 'Failed to save chat');
        }
    });
};