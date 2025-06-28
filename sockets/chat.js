const ChatMessage = require('../models/ChatMessage')

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
        } 
        catch(error) {
            console.error('❌ Chat save failed:', error.message);
            socket.emit('error', 'Failed to save chat');
        }
    });
};