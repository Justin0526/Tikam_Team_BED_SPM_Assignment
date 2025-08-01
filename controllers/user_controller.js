const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const userModel = require("../models/user_model");

// Get all users
async function getAllUsers(req, res) {
    try {
        const user = await userModel.getAllUsers();
        res.json(user);
    } catch (error) {
        console.error("Controller error: ", error);
        res.status(500).json({ message: "Error retrieving users" });
    }
}

// Get user by username
async function getUserByUsername(req, res) {
    try {
        const username = req.body.username;
        const user = await userModel.getUserByUsername(username);
        if (!user) {
            return res.status(404).json({ message: "User not found!" });
        }
        res.json(user);
    } catch (error) {
        console.error("Controller error: ", error);
        res.status(500).json({ message: "Error retrieving user" });
    }
}

// Register a new user
async function registerUser(req, res) {
    const { fullName, username, email, password } = req.body;
    try {
        // ✅ Check if username exists
        const existingUser = await userModel.getUserByUsername(username);
        if (existingUser) {
            return res.status(400).json({ message: "Username already exists. Please choose another one." });
        }

        // ✅ Check if email exists
        const existingUserByEmail = await userModel.getUserByEmail(email);
        if (existingUserByEmail) {
            return res.status(400).json({ message: "Email already registered. Please use another email." });
        }

        // ✅ Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = {
            fullName,
            username,
            email,
            passwordHash: hashedPassword,
        };

        const newUser = await userModel.createUser(user);
        res.status(201).json({
            message: "Account created successfully!",
            user: {
                userID: newUser.userID,
                fullName: newUser.fullName,
                username: newUser.username,
                email: newUser.email
            }
        });
    } catch (error) {
        console.error("Controller error: ", error);
        res.status(500).json({ message: "Error creating user" });
    }
}

// Login user
async function loginUser(req, res) {
    const { username, password } = req.body;

    try {
        const user = await userModel.getUserByUsername(username);
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // ✅ Generate JWT token
        const payload = {
            userID: user.userID,
            username: user.username,
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: "28000s" }); // 8 hours
        return res.status(200).json({ message: "Login successful", token });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

module.exports = {
    loginUser,
    getUserByUsername,
    registerUser,
    getAllUsers,
};
