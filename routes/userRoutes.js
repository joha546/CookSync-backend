const express = require('express');
const router = express.Router();
const requireAuth = require('../middlewares/requireAuth');
const requireAdmin = require('../middlewares/requireAdmin');
const requireRole = require('../middlewares/requireRole');
const {requestChef, listChefRequests, approveChef, toggleFavorite, getFavorites, updatePreferences, ProfilePage, Preferences} = require('../controllers/userController');
const User = require('../models/User');

router.post('/request-chef', requireAuth, requestChef);
router.get('/admin/chef-requests', requireAuth, requireRole('admin'), listChefRequests);
router.patch('/admin/approve-chef/:userId', requireAuth, requireRole('admin'), approveChef);

// Favorites Routes
router.post('/favorites/:recipeId', requireAuth, toggleFavorite);
router.get('/favorites', requireAuth, getFavorites);

// Dietary preferences
router.patch('/preferences', requireAuth, updatePreferences);

// User profile route.
router.get('/me', requireAuth, ProfilePage);




// ❌ Reject chef
router.patch('/admin/reject-chef/:userId', requireAuth, requireAdmin, async (req, res) =>{
  try{
    const user = await User.findById(req.params.userId);
    if(!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    user.chefRequest.status = 'rejected';
    await user.save();

    res.json({ message: 'Chef request rejected' });
  }
  catch(err){
    res.status(500).json({ error: 'Failed to reject chef' });
  }
});

// 👥 Get all users
router.get('/admin/users', requireAuth, requireAdmin, async (req, res) => {
  const users = await User.find().select('-__v');
  res.json(users);
});


module.exports = router;