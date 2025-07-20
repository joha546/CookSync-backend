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

exports.sendOTP = async (email, otp) => {
    const htmlTemplate = `
    <div style="max-width: 520px; margin: auto; background: #ffffff; border-radius: 12px; padding: 30px; font-family: 'Segoe UI', sans-serif; box-shadow: 0 4px 10px rgba(0,0,0,0.05); border: 1px solid #e4e4e4;">
        <div style="text-align: center;">
            <h2 style="color: #028338; font-size: 24px; margin-bottom: 10px;">🥗 CookSync Email Verification</h2>
            <p style="font-size: 16px; color: #333; margin-bottom: 25px;">Hello! Use the OTP below to complete your verification:</p>
            <div style="display: inline-block; padding: 16px 32px; font-size: 30px; font-weight: 700; color: #ffffff; background-color: #028338; border-radius: 10px; letter-spacing: 6px; margin: 10px 0;">
                ${otp}
            </div>
            <p style="margin-top: 25px; font-size: 14px; color: #555;">This OTP is valid for the next <strong>5 minutes</strong> only.</p>
            <p style="font-size: 13px; color: #999;">Do not share this OTP with anyone.</p>
        </div>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
        <div style="font-size: 12px; color: #aaa; text-align: center;">
            If you did not request this code, please disregard this email.<br/>
            &copy; ${new Date().getFullYear()} <strong>CookSync</strong>. All rights reserved.
        </div>
    </div>
    `;

    await transporter.sendMail({
        from: "CookSync 🔥" <${process.env.MAIL_USER}>,
        to: email,
        subject: "Your CookSync OTP Code",
        html: htmlTemplate
    });
};