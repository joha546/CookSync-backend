const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email:{ 
    type: String, required: true, unique: true 
  },

  role:{ 
    type: String, enum: ['user', 'chef', 'admin'], default: 'user' 
  },

  chefRequest:{
    status: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
    submittedAt: Date
  },

  favorites: [{
    type: mongoose.Schema.Types.ObjectId, ref: 'Recipe'
  }],

  preferences:{
    vegan: {type: Boolean, default: false},
    vegetarian: {type: Boolean, default: false},
    nutAllergy: {type: Boolean, default: false},
    glutenFree: {type: Boolean, default: false}
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
