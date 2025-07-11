const Recipe = require('../models/Recipe');

exports.createRecipe = async(req, res) => {
    try{
        const {
            title, description, ingredients, instructions, servings,
            prepTime, cookTime, coolTime, category, tags, nutrition, chefId
        } = req.body;

        const totalTime = Number(prepTime) + Number(cookTime) + Number(coolTime);

        const recipe = new Recipe({
            title,
            description,
            ingredients: JSON.parse(ingredients),
            instructions: JSON.parse(instructions),
            imageUrl: req.file?.path,
            servings,
            prepTime,
            cookTime,
            coolTime,
            totalTime,
            category,
            tags: JSON.parse(tags),
            nutrition: JSON.parse(nutrition),
            chefId
        });

        await recipe.save();

        // Emit new recipe event.
        const io = req.app.get('io');
        io.emit('new-recipe', recipe);

        res.status(201).json(recipe);
    }
    catch(error){
        // console.error(error);
        res.status(500).json({error: 'Failed to create recipe'})
    }
};

// get all recipes
exports.getAllRecipes = async(req, res) => {
    const query = {};

    // Filter based on diet preferences
    if(req.query.diet){
        query.tags = {$in: [req.params.diet]};   // tags must include the dietary label

    }
    
    const recipes = await Recipe.find(query).sort({createdAt: -1});
    res.json(recipes);
};

exports.getRecipeById = async(req, res) => {
    const recipe = await Recipe.findById(req.params.id);
    if(!recipe){
        return res.status(404).json({ error: 'Recipe not found'});
    }
    res.json(recipe);
};

exports.updateRecipe = async (req, res) => {
  const recipe = await Recipe.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(recipe);
};

exports.deleteRecipe = async (req, res) => {
  await Recipe.findByIdAndDelete(req.params.id);
  res.json({ message: 'Recipe deleted' });
};