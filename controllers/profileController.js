const profileModel = require('../models/userProfile_model');

exports.getProfile = async (req, res) => {
  try {
    const userID = parseInt(req.params.userID);
    const data = await profileModel.getUserProfile(userID);
    res.json(data);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Failed to load profile." });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userID = parseInt(req.body.userID);
    const data = req.body;
    await profileModel.updateUserProfile(userID, data);
    res.status(200).json({ message: 'Profile updated successfully.' });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Profile update failed." });
  }
};
