const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  recipeId:{ 
    type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true 
  },
  userId:{ 
    type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true 
  },
  message:{ 
    type: String, 
    required: true 
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
