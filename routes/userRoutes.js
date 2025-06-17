const express = require('express');
const router = express.Router();
const requireAuth = require('../middlewares/requireAuth');
const requireRole = require('../middlewares/requireRole');
const {requestChef, listChefRequests, approveChef, toggleFavorite, getFavorites, updatePreferences} = require('../controllers/userController');

router.post('/request-chef', requireAuth, requestChef);
router.get('/admin/chef-requests', requireAuth, requireRole('admin'), listChefRequests);
router.patch('/admin/approve-chef/:userId', requireAuth, requireRole('admin'), approveChef);

// Favorites Routes
router.post('/favorites/:recipeId', requireAuth, toggleFavorite);
router.get('/favorites', requireAuth, getFavorites);

// Dietary preferences
router.patch('/preferences', requireAuth, updatePreferences);

module.exports = router;