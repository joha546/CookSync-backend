const cloudinary = require('cloudinary').v2;
const {cloudinaryStorage, CloudinaryStorage} = require('multer-storage-cloudinary');
const dotenv = require('dotenv');

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'cooksync',
        allowed_formats: ['jpg', 'jpeg', 'png'],
        transformation: [{width: 800, height: 600, crop: 'limit'}]
    }
});

module.exports = {cloudinary, storage};