const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const recipeController = require('../controllers/recipeController');
const requireAuth = require('../middlewares/requireAuth');
const requireRole = require('../middlewares/requireRole');
const requireAdmin = require('../middlewares/requireAdmin');


router.post('/', requireAuth, requireRole('chef'), upload.single('image'), recipeController.createRecipe);
router.get('/', recipeController.getAllRecipes);
router.get('/:id', recipeController.getRecipeById);
router.put('/:id', requireAuth, requireRole('chef'), recipeController.updateRecipe);
router.delete('/:id', requireAuth, requireRole('chef'), recipeController.deleteRecipe);

// Add admin delete route
router.delete('/admin/:id', requireAuth, requireAdmin, recipeController.deleteRecipe);

// Like, comment, view routes.
router.post('/:id/like', requireAuth, recipeController.toggleLike);
router.post('/:id/view', requireAuth, recipeController.addView);
router.post('/:id/comment', requireAuth, recipeController.addComment);
router.delete('/:id/comment/:commentId', requireAuth, recipeController.deleteComment);

module.exports = router;