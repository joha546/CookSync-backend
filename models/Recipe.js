const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    imageUrl: String,
    chefId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    ingredients: [String],
    instructions: [String],
    servings: Number,
    prepTime: Number,
    cookTime: Number,
    coolTime: Number,
    totalTime: Number,
    category: String,
    tags: [String],
    nutrition: {
        calories: Number,
        fats: Number,
        carbs: Number,
        protein: Number,
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    
    // For keeping track who liked, commented post.
    likes: [
        {
            userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
            likedAt: {
                type: Date,
                default: Date.now
            }
        }
    ],
    views: [
        {
            userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
            viewedAt: {
                type: Date, default: Date.now}
        }
    ],
    comments: [
        {
            userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
            text: String,
            createdAt: {type: Date, default: Date.now}
        }
    ],
    activeSession:{
        type: Boolean,
        default: false
    },
    sessionStartedAt:{
        type: Date,
        default: null
    }
},
{
    timestamps: true
});

module.exports = mongoose.model('Recipe', recipeSchema);