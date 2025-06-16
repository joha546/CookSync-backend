const OTP = require('../models/OTP');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const {sendOTP : sendMail} = require('../utils/mailer');
const dotenv = require('dotenv');

dotenv.config();

// Send OTP
exports.sendOTP = async(req, res) => {
    const {email} = req.body;

    if(!email){
        return res.status(400).json({ error: 'Email is required.'});
    }

    const otpCode = crypto.randomInt(100000, 999999).toString();
    await OTP.deleteMany({ email });

    const otp = new OTP({email, otp: otpCode});
    await otp.save();

    try{
        await sendMail(email, otpCode);
        res.status(200).json({
            message: 'OTP sent to email'
        });
    }
    catch(error){
        res.status(500).json({
            error: 'Failed to send OTP'
        })
    }
};


// Verify OTP
exports.verifyOTP = async(req, res) => {
    const {email, otp} = req.body;

    if(!email || !otp){
        return res.status(400).json({ error: 'Email and OTP required' });
    }

    // Check email and otp
    const existing = await OTP.findOne({email, otp});
    if(!existing){
        return res.status(401).json({ error: 'Invalid or expired OTP' });
    };

    let user = await User.findOne({email});
    // if user is not found,
    // then it will create a new user.
    if(!user){
        user = await User.create({ email });

        // Assign admin role if email matches.
        if(email === process.env.ADMIN_EMAIL){
            user.role = 'admin';
            await user.save();
        }
    }

    // If user already exists but role is still 'user', and email is admin — promote
    if(user.role !== 'admin' && email === process.env.ADMIN_EMAIL){
        user.role = 'admin';
        await user.save();
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: '7d'
    });

    await OTP.deleteMany({ email }); // cleanup used OTPs
    res.status(200).json({ token, user });
};