const jwt = require("jsonwebtoken");
const  env  = require("../config/env");

const auth = async (req, res, next) => {
    try{
        //get token from header
        const authHeader = req.headers.authorization;
        if(!authHeader || !authHeader.startsWith("Bearer")){
            return res.status(401).json({ 
                success: false,
                message: "Unauthorized access" 
            });
        };
        //token
        const token = authHeader.split(" ")[1];
        //verify token
        const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);

        //attach usres
        req.user = decoded;
        next();
    }
    catch (error) {
        res.status(401).json({ 
            success: false,
            message: "Invalid token"
         });
    }
};
module.exports = auth;