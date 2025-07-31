const profileModel = require('../models/userProfile_model');

exports.getProfile = async (req, res) => {
  try {
    const userID = parseInt(req.params.userID);
    if (req.user.userID !== userID) {
      return res.status(403).json({ error: "Unauthorized access." });
    }
    const data = await profileModel.getUserProfile(userID);
     if (data && data.profilePicture == null) {
      data.profilePicture = '../images/default_avatar.png'; // Default image path
    }

    if (!data) return res.status(404).json({ error: "Profile not found." });
    res.json(data);
  } catch (error) {
    console.error("❌ Get profile error:", error);
    res.status(500).json({ error: "Failed to load profile." });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userID = parseInt(req.body.userID);
    if (req.user.userID !== userID) {
      return res.status(403).json({ error: "Unauthorized update." });
    }
    console.log("🔥 Request Body (before DB update):", req.body);

    const result = await profileModel.updateUserProfile(userID, req.body);
    if (result.rowsAffected[0] === 0) return res.status(404).json({ error: "User not found." });
    res.status(200).json({ message: '✅ Profile updated successfully.' });
  } catch (error) {
    console.error("❌ Update profile error:", error);
    res.status(500).json({ error: "Profile update failed." });
  }
};

exports.removeProfilePicture = async (req, res) => {
  try {
    const userID = parseInt(req.params.userID);
    if (req.user.userID !== userID) {
      return res.status(403).json({ error: "Unauthorized action." });
    }
    const result = await profileModel.removeProfilePicture(userID);
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "User not found." });
    }
    res.status(200).json({ message: "✅ Profile picture removed successfully." });
  } catch (error) {
    console.error("❌ Remove profile picture error:", error);
    res.status(500).json({ error: "Failed to remove profile picture." });
  }
};
