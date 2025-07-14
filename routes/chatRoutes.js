const express = require('express');
const router = express.Router();
const requireAuth = require('../middlewares/requireAuth');
const ChatMessage = require('../models/ChatMessage');

router.get('/:recipeId', requireAuth, async(req, res) =>{
  const { recipeId } = req.params;

  try{
    const messages = await ChatMessage.find({ recipeId })
      .sort({ createdAt: 1 })
      .populate('userId', 'email');

    res.json(messages.map(msg =>({
      message: msg.message,
      by: msg.userId.email,
      at: msg.createdAt
    })));
  }
  catch (err){
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

module.exports = router;
