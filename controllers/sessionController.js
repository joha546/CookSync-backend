const Recipe = require('../models/Recipe');

exports.startSession = async(req, res) =>{
    try{
        const recipeId = req.params.id;
        const userId = req.user.id;

        const recipe = await Recipe.findById(recipeId);
        if(!recipe){
            return res.status(400).json({error: 'Recipe not found'});
        }

        if(recipe.chefId.toString() !== userId){
            return res.status(403).json({error: 'Only chef can start a session for recipe'});
        }

        recipe.activeSession = true;
        await recipe.save();

        res.json({message: 'Session started', recipeId});
    }
    catch(error){
        console.error('startSession Error: ', error.message);
        res.status(500).json({error: 'Failed to start session'});
    }
}