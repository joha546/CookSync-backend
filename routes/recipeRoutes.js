const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const recipeController = require('../controllers/recipeController');
const requireAuth = require('../middlewares/requireAuth');
const requireRole = require('../middlewares/requireRole');

router.post('/', requireAuth, requireRole('chef'), upload.single('image'), recipeController.createRecipe);
router.get('/', recipeController.getAllRecipes);
router.get('/:id', recipeController.getRecipeById);
router.put('/:id', requireAuth, requireRole('chef'), recipeController.updateRecipe);
router.delete('/:id', requireAuth, requireRole('chef'), recipeController.deleteRecipe);

module.exports = router;