const Recipe = require('../models/Recipe');
const Notification = require('../models/Notification');

exports.createRecipe = async(req, res) => {
    try{
        //Only a chef can post.
        if(req.user.role !== 'chef'){
            return res.status(403).json({error: 'Only chefs can create recipes'});
        }
        const {
            title, description, ingredients, instructions, servings,
            prepTime, cookTime, coolTime, category, tags, nutrition
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
            chefId: req.user.id    // Always use authenticated userID.
        });

        await recipe.save();

        // Emit new recipe event.
        const io = req.app.get('io');
        io.emit('new-recipe', recipe);

        res.status(201).json(recipe);
    }
    catch(error){
        console.error(error);
        res.status(500).json({error: 'Failed to create recipe'})
    }
};

// get all recipes
exports.getAllRecipes = async(req, res) => {
    const {diet, sortBy = 'new', page = 1, limit = 10} = req.query;
    const query = {};

    // Filter based on diet preferences
    if(diet){
        query.tags = {$in: [diet]};   // tags must include the dietary label
    }
    
    let sortOption = {createdAt: -1}  // default: newest.
    
    if(sortBy==='likes'){
        sortOption = {'likes.length': -1};
    }

    if(sortBy==='views'){
        sortOption = {'views.length': -1};
    }

    try{
        const recipes = await Recipe.find(query)
            .sort(sortOption)
            .skip((page-1) * limit)
            .limit(parseInt(limit))
            .populate('likes.userId', 'email')
            .populate('comments.userId', 'email');
        
        res.json(recipes);
    }
    catch(error){
        res.status(500).json({error: 'Failed to fetch recipes.'})
    }
};

exports.getRecipeById = async(req, res) => {
    const recipe = await Recipe.findById(req.params.id);
    if(!recipe){
        return res.status(404).json({ error: 'Recipe not found'});
    }
    res.json(recipe);
};

exports.updateRecipe = async (req, res) =>{
    try {
      const recipe = await Recipe.findById(req.params.id);
  
      if(!recipe){
        return res.status(404).json({ error: 'Recipe not found' });
      }
  
      if(recipe.chefId.toString() !== req.user.id){
        return res.status(403).json({ error: 'Not authorized to update this recipe' });
      }
  
      const updated = await Recipe.findByIdAndUpdate(req.params.id, req.body, { new: true });

      res.json(updated);
    } 
    catch(error){
      res.status(500).json({ error: 'Failed to update recipe' });
    }
  };
  

  exports.deleteRecipe = async (req, res) => {
    try{
      const recipe = await Recipe.findById(req.params.id);
  
      if(!recipe){
        return res.status(404).json({ error: 'Recipe not found' });
      }
  
      if(recipe.chefId.toString() !== req.user.id){
        return res.status(403).json({ error: 'Not authorized to delete this recipe' });
      }
  
      await recipe.deleteOne();

      res.json({ message: 'Recipe deleted' });
    }
    catch(error){
      res.status(500).json({ error: 'Failed to delete recipe' });
    }
  };
  


// Like, comment, view controllers.

// Toggle Like.
exports.toggleLike = async (req, res) =>{
  const { id } = req.params;
  const userId = req.user.id;

  try{
    const recipe = await Recipe.findById(id).populate('chefId', 'email');

    if(!recipe){
      return res.status(404).json({ error: 'Recipe not found' });
    }

    const existing = recipe.likes.find(like => like.userId.toString() === userId);

    if(existing){
      recipe.likes = recipe.likes.filter(like => like.userId.toString() !== userId);
      await recipe.save();
      return res.json({ message: 'Like removed' });
    }

    recipe.likes.push({ userId });
    await recipe.save();

    // Send notification to recipe owner (if not liking their own)
    if(recipe.chefId && recipe.chefId._id.toString() !== userId){

      const notif = await Notification.create({
        user: recipe.chefId._id,
        message: `${req.user.email} liked your recipe "${recipe.title}"`,
        link: `/recipes/${recipe._id}`,
        type: 'like'
      });

      // emit real-time notification if they're connected
      const io = req.app.get('io');
      const sockets = await io.fetchSockets();

      sockets.forEach(sock =>{
        if(sock.user && sock.user._id.toString() === recipe.chefId._id.toString()){
          sock.emit('new-notification',{
            type: 'like',
            message: notif.message,
            link: notif.link,
            createdAt: notif.createdAt
          });
        }
      });
    }

    res.json({ message: 'Liked' });
  }
  catch (error) {
    console.error('❌ toggleLike error:', error.message);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
};


// Add view.
exports.addView = async(req, res) => {
    const {id} = req.params;
    const userId = req.user.id;

    try{
        const recipe = await Recipe.findById(id);

        if(!recipe){
            return res.status(404).json({ error: 'Recipe not found' });
        }

        const alreadyViewed = recipe.views.find(view => view.userId.toString() === userId);

        if(!alreadyViewed){
            recipe.views.push({userId});
            await recipe.save();
        }

        res.json({ message: 'View recorded' });
    }
    catch(error){
        res.status(500).json({ error: 'Failed to record view' });
    }
}


// Add comment.
exports.addComment = async(req, res) => {
    const {id} = req.params;
    const {text} = req.body;
    const {userId} = req.user.id;

    if(!text){
        return res.status(400).json({error: 'Comment text is required'});
    }

    try{
        const recipe = await Recipe.findById(id);

         if(!recipe){
            return res.status(404).json({ error: 'Recipe not found' });
        }

        recipe.comments.push({userId, text});
        await recipe.save();

        // Notify recipe owner (if not commenting on own recipe)
        if(recipe.chefId._id.toString() !== userId) {
            const notif = await Notification.create({
                user: recipe.chefId._id,
                message: `${req.user.email} commented on your recipe "${recipe.title}"`,
                link: `/recipes/${recipe._id}`,
                type: 'comment'
            });

            // Real time notification emit
            const io = req.app.get('io');
            const sockets = await io.fetchSockets();

            sockets.forEach(sock => {
                if(sock.user && sock.user._id.toString() === recipe.chefId._id.toString()) {
                    sock.emit('new-notification',{
                        type: 'comment',
                        message: notif.message,
                        link: notif.link,
                        createdAt: notif.createdAt
                    });
                }
            });
        }

        res.json({message: 'Comment added.'});
    }
    catch(error){
        console.error('❌ addComment error:', error.message);
        res.status(500).json({ error: 'Failed to add comment' });
    }
}


// Delete comment.
exports.deleteComment = async(req, res) => {
    const {id, commentId} = req.params;
    const userId = req.user.id;

    try{
        const recipe = await Recipe.findById(id);

        if(!recipe){
            return res.status(404).json({ error: 'Recipe not found' });
        }

        const comment = recipe.comments.id(commentId);

        if(!comment){
            return res.status(404).json({ error: 'Comment not found' });
        }

        if(comment.userId.toString() !== userId){
            return res.status(403).json({error: 'Not authorized to delte this comment.'});
        }

        comment.remove();
        await recipe.save();
        res.json({message: 'Comment deleted.'});
    }
    catch(error){
        res.status(500).json({ error: 'Failed to add comment' });
    }
}