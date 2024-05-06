const jwt = require("jsonwebtoken");
const USER = require("./Model/usermodel");
const secretKey = process.env.KEY;

const athenticate = async(req,res,next)=>{
    try {
        const token = req.cookies.Shopshop;

        if(token=== undefined){
        }
        else{

        const verifyToken = jwt.verify(token,secretKey);
        // console.log(verifyToken);

        const rootUser = await USER.findOne({_id:verifyToken._id});
        // console.log(rootUser);
        // console.log("this is it")

        if(!rootUser){throw new Error("user not found")};

        req.token = token
        req.rootUser = rootUser
        req.userID = rootUser._id
        }
        next();

    } catch (error) {
        res.status(401).send("unautherized:No token provide")
        // console.log(error)
    }
}

module.exports = athenticate;