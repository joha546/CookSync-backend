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