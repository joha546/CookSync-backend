const express = require('express');
const router = express.Router();
const requireAuth = require('../middlewares/requireAuth');
const Notification = require('../models/Notification');


// GET all notifications for the current user
router.get('/', requireAuth, async(req, res) => {
    try{
        const notification = await Notification.find({user: req.user.id})
            .sort({createdAt: -1});
        
        res.json(notification);
    }
    catch(error){
        res.status(500).json({error: 'Failed to fetch notifications'});
    }
});

// Mark a notification as read
router.post('/read/:id', requireAuth, async(req, res) => {
    try{
        const notif = await Notification.findOne({_id: req.params.id, user: req.user.id})

        if(!notif){
            return res.status(404).json({ error: 'Notification not found' });
        }

        notif.read = true;
        await notif.save();

        res.json({message: 'Marked as read'});
    }
    catch(error){
        res.status(500).json({error: 'Failed to fetch notifications'});
    }
})

module.exports = router;