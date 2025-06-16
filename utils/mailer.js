const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

exports.sendOTP = async(email, otp) =>{
    await transporter.sendMail({
        from: `"CookSync 🔥" <${process.env.MAIL_USER}>`,
        to: email,
        html: `<h3>Your OTP is: <strong>${otp}</strong></h3><p>Expires in 5 minutes.</p>`
    });
};