// controllers/upload_controller.js
const { v2: cloudinary } = require('cloudinary');
const multer              = require('multer');
const streamifier         = require('streamifier');
require('dotenv').config();

// configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// multer into memory
const upload = multer({ storage: multer.memoryStorage() });

// this is an array of two middleware functions:
const uploadImage = [
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      // wrap stream upload in a Promise
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'posts_images' },
          (err, result) => err ? reject(err) : resolve(result)
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
      // return the secure URL
      res.json({ url: result.secure_url, public_id: result.public_id });
    } catch (err) {
      console.error('Upload error:', err);
      res.status(500).json({ error: err.message });
    }
  }
];

module.exports = { uploadImage };
