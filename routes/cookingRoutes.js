const express = require('express');
const router = express.Router();
const requireAuth = require('../middlewares/requireAuth');
const CookingSession = require('../models/CookingSession');

// Get all steps for a recipe
router.get('/:recipeId', requireAuth, async(req, res) =>{
  const { recipeId } = req.params;

  try {
    const steps = await CookingSession.find({ recipeId })
      .sort({ createdAt: 1 })
      .populate('userId', 'email');

    res.json(steps.map(s =>({
      step: s.step,
      by: s.userId.email,
      at: s.createdAt
    })));
  } 
  catch(err){
    res.status(500).json({ error: 'Failed to fetch cooking steps' });
  }
});

module.exports = router;
