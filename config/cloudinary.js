const cloudinary = require('cloudinary');
const cloudinaryStorage = require('multer-storage-cloudinary');
const dotenv = require('dotenv');

dotenv.config();

cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = cloudinaryStorage({
    cloudinary,
    folder: 'cooksync',
    allowedFormats: ['jpg', 'jpeg', 'png'],
    transformation: [{ width: 800, height: 600, crop: 'limit' }]
});

module.exports = { cloudinary: cloudinary.v2, storage };
