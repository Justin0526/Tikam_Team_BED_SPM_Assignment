// Justin Tang Jia Ze S10269496B
const jwt = require("jsonwebtoken");

function verifyJWT(req, res, next){
    const token = req.headers.authorization && req.headers.authorization.split(" ")[1];

    if(!token){
        return res.status(401).json({message: "Unauthorized"});
    }

    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, user) => {
        if (err){
            return res.status(403).json({message: "Forbidden"});
        }

        req.user = user;
        next();
    })
}       

module.exports = {
    verifyJWT,
}