const mongoose = require('mongoose');

const cookingSessionSchema = new mongoose.Schema({
  recipeId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe',
    required: true
  },
  userId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  step:{
    type: String,
    required: true
  },
  createdAt:{
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('CookingSession', cookingSessionSchema);
