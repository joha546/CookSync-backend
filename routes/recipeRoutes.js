const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const recipeController = require('../controllers/recipeController');

router.post('/', upload.single('image'), recipeController.createRecipe);
router.get('/', recipeController.getAllRecipes);
router.get('/:id', recipeController.getRecipeById);
router.put('/:id', recipeController.updateRecipe);
router.delete('/:id', recipeController.deleteRecipe);

module.exports = router;