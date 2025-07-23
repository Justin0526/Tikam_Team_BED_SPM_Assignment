const profileModel = require('../models/userProfile_model');

exports.getProfile = async (req, res) => {
  try {
    const userID = parseInt(req.params.userID);
    const data = await profileModel.getUserProfile(userID);
    if (!data) {
      return res.status(404).json({ error: "Profile not found." });
    }
    res.json(data);
  } catch (error) {
    console.error("❌ Get profile error:", error);
    res.status(500).json({ error: "Failed to load profile." });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userID = parseInt(req.body.userID);
    const data = req.body;

    console.log("🛠 Updating profile for userID:", userID);
    console.log("📦 Data received:", data);

    const result = await profileModel.updateUserProfile(userID, data);

    if (result.rowsAffected[0] === 0) {
      console.warn("⚠️ No rows updated. Invalid userID?");
      return res.status(404).json({ error: "User not found or no changes applied." });
    }

    res.status(200).json({ message: '✅ Profile updated successfully.' });
  } catch (error) {
    console.error("❌ Update profile error:", error);
    res.status(500).json({ error: "Profile update failed." });
  }
};
