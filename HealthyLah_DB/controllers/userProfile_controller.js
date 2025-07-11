// controllers/userProfile_controller.js
const profileModel = require('../models/profileModels');

exports.updateProfile = async (req, res) => {
  try {
    const userID = parseInt(req.body.userID); // Temporary (replace with JWT later)
    const data = req.body;

    const result = await profileModel.updateUserProfile(userID, data);
    res.status(200).json({ message: 'Profile updated successfully.' });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Something went wrong. Try again later.' });
  }
};

exports.uploadProfilePic = async (req, res) => {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({ message: 'No image file uploaded.' });
    }

    const imageUrl = req.file.path; // Cloudinary returns full URL here
    res.status(200).json({
      message: 'Upload successful',
      imageUrl: imageUrl
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: 'Image upload failed' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userID = parseInt(req.params.userID);
    const result = await profileModel.getUserProfile(userID);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "User profile not found" });
    }

    res.status(200).json(result.recordset[0]);
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ message: "Failed to load profile data" });
  }
};
