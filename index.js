require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const initdata = require("./initdata");
const router = require("./router")
const cookieParser = require("cookie-parser");
const stripe = require("stripe")(process.env.STRIPE_KEY)

const DB = process.env.DATABASE;

mongoose.connect(DB).then(()=>
    {
        console.log("database connectedd")

    }
).catch((error)=> 
    {}
)



const cors = require("cors");



app.use(express.json()); // Use built-in JSON parser
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    // origin:["http://localhost:3000"],
    methods:["GET","POST","DELETE"],
    credentials:true
}));
app.use(cookieParser());

app.use(router);


const port = process.env.PORT || 8005;



app.listen(port,()=>{
    // console.log(`server is running on port number ${port}`);
});

initdata();
