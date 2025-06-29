const User = require('../models/User');

// Request chef access.
exports.requestChef = async(req, res) => {
    const user = req.user;

    if(user.chefRequest.status == 'approved'){
        return res.status(400).json({error: 'Already a chef'});
    }

    user.chefRequest = {
        status: 'pending',
        submittedAt: new Date()
    };

    await user.save();
    res.status(200).json({ message: 'Chef request submitted' });
}

// List all pending chef requests (admin)
exports.listChefRequests = async(req, res) => {
  const requests = await User.find({'chefRequest.status': 'pending' }).select('email role chefRequest');
  res.json(requests);
};

//Approve a chef request(admin)
exports.approveChef = async(req, res) => {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.role = 'chef';
    user.chefRequest.status = 'approved';
    await user.save();

    res.json({message: 'Chef approved', user});
};

// Toggle Favorites.
exports.toggleFavorite = async(req, res) => {
    const user = req.user;
    const recipeId = req.params.recipeId;

    const index = user.favorites.indexOf(recipeId);

    if(index === -1){
        user.favorites.push(recipeId);
        await user.save();
        return res.status(200).json({message: 'Recipe added to favorites'});
    }
    else{
        user.favorites.splice(index, 1);
        await user.save();
        return res.status(200).json({ message: 'Recipe removed from favorites' });
    }
};

// Get All Favorites.
exports.getFavorites = async(req, res) => {
    const user = await User.findById(req.user._id).populate('favorites');
    res.status(200).json(user.favorites);
};

// Update Dietary Preferences
exports.updatePreferences = async(req, res) =>{
  const updates = req.body;
  const user = await User.findById(req.user._id);

  user.preferences ={
    ...user.preferences,
    ...updates
  };

  await user.save();
  res.status(200).json({ message: 'Preferences updated', preferences: user.preferences });
};

// Profile page.
exports.ProfilePage = async(req, res) => {
    try{
        const user = await User.findById(req.user.id).select('-__v');
        if(!user){
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    }
    catch(error){
        res.status(500).json({message: 'Failed to fetch user.'});
    }
};