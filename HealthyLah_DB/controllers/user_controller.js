const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const userModel = require("../models/user_model");

// get all users
async function getAllUsers(req, res){
    try{
        const user = await userModel.getAllUsers();
        res.json(user);
    }catch(error){
        console.error("Controller error: ", error);
        res.status(500).json({error: "Error retrieving user"});
    }
}

// get user by username
async function getUserByUsername(req, res){
    try{
        const username = req.body.username;
        const user = await userModel.getUserByUsername(username);
        if(!user){
            return res.status(404).json({error: "User not found!"});
        }

        res.json(user);
    }catch(error){
        console.error("Controller error: ", error);
        res.status(500).json({error: "Error retrieving user"});
    }
}

// create new user
async function registerUser(req, res){
    const {fullName, username, email, password} = req.body;
    try{
        // check for exisiting user;
        const existingUser = await userModel.getUserByUsername(username);
        if(existingUser){
            return res.status(400).json({message: "Username already exist!"});
        }

        // Hash password 
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = {
            fullName: fullName,
            username: username,
            email: email,
            passwordHash: hashedPassword,
        }
        const newUser = await userModel.createUser(user);
        res.status(201).json({message: newUser});
    }catch(error){
        console.error("Controller error: ", error);
        res.status(500).json({error: "Error creating user"});
    }
}

async function loginUser(req, res){
    const {username, password} = req.body;

    try{
        const user = await userModel.getUserByUsername(username);
        if(!user){
            return res.status(401).json(
                {message: "Invalid credentials"}
            )
        }

        // Compare password with hash
        const isMatch = await bcrypt.compare(password, user.passwordHash)
        if(!isMatch){
            return res.status(401).json(
                {message: "Invalid credentials"}
            )
        }

        // Generate JWT token
        const payload = {
            userID : user.userID,
            gender: user.gender
        };

        console.log(user);
        const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, {expiresIn: "3600s"}) // Expire in 1 hour

        return res.status(200).json({token});
    }catch(error){
        console.error(error);
        return res.status(500).json({message: "Internal server error"})
    }
}

module.exports = {
    loginUser,
    getUserByUsername,
    registerUser,
    getAllUsers,
}