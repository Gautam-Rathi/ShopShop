const express = require("express");
const router = new express.Router();
const Products = require("./Model/productmodel");
const User = require("./Model/usermodel")
const bcrypt = require("bcryptjs");
const athenticate = require("./middlewareauth")
const stripe = require("stripe")(process.env.STRIPE_KEY)


router.get("/getproducts", async (req, res) => {
    try {
        const productsdata = await Products.find();
        // console.log("console the data" +  productsdata);
        res.status(201).json(productsdata);
    } catch (error) {
        // console.log("error" + error.message);
    }
});

// get individual data
router.get("/getproductsone/:id", async (req, res) => {
    try {
        const { id } = req.params;
        // console.log(id);

        const individuadata = await Products.findOne({ id: id });

        // console.log(individuadata + "individual data");

        res.status(201).json(individuadata);

    } catch (error) {
        res.status(400).json(individuadata);
        // console.log("error" + error.message);
    }
});

// register data

router.post("/register", async (req, res) => {
    // console.log(req.body);

    const { fname, email, mobile, password, cpassword } = req.body;
    console.log(req.body)

    if (!fname || !email || !mobile || !password || !cpassword) {
        res.status(422).json({ error: "fill the all data" });
        // console.log("not data available");
    }
    else{


    try {
        const preuser = await User.findOne({ email: email });

        if (preuser) {
            res.status(422).json({ error: "this user is already present" })
        } else if (password !== cpassword) {
            res.status(422).json({ error: "password and cpassword not match" })
        } else if (mobile.length !== 10 || isNaN(+mobile)) {
            res.status(422).json({ error: "mobile no is invalid" })
        } else if (password.length<6) {
            res.status(422).json({ error: "password is smaller than 6 letters" })
        } else if (!email.includes("@gmail.com")) {
            res.status(422).json({ error: "invalid email" })
        }

        else {
            console.log(req.body)
            const finalUser = new User({
                fname, email, mobile, password, cpassword
            });

            // harsh -> encrypt  hujug ->> decrypt-> harsh
            // bcryptjs 

            // password hasing process

            const storedata = await finalUser.save();
            console.log(storedata);

            res.status(201).json(storedata);
        }



    } catch (error) {
        res.status(401).json(error);
    }
}

});



// login user api

router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400).json({ error: "fill the all data" })
    }
    else{

    try {
        const userlogin = await User.findOne({ email: email });
        // console.log(userlogin + "user value");

        if (userlogin) {
            const isMatch = await bcrypt.compare(password, userlogin.password);
            // console.log(isMatch + "pass match");

           
           

            if (!isMatch) {
                res.status(400).json({ error: "invalid detials" });
            } else {

                 // token genrate
                const token = await userlogin.generateAuthtokenn();
                // console.log(token);
    
                res.cookie("Shopshop",token,{
                    expires:new Date(Date.now() + 9000000),
                    httpOnly:true,
                    // sameSite: 'None',
                    // secure:true

                    
                })

                // console.log(req.cookies)


                res.status(201).json(userlogin);
            }

        } else {
            res.status(400).json({ error: "invalid detials" })
        }
    } catch (error) {
        res.status(400).json({ error: "invalid detials" })
    }
}
})

// adding the data into cart

router.post("/addcart/:id",athenticate,async(req,res)=>{
    try {
        const {id} = req.params;
        const cart = await Products.findOne({id:id});
        // console.log(cart + "cart value");

        const UserContact = await User.findOne({_id:req.userID});
        // console.log(UserContact);


        if(UserContact){
            const cartData = await UserContact.addcartdata(cart);
            await UserContact.save();
            // console.log(cartData);
            res.status(201).json(UserContact);
        }else{
            res.status(401).json({error:"invalid user"});
        }


    } catch (error) {
        res.status(401).json({error:"invalid user"});
    }
});


// get cart details

router.get("/cartdetails",athenticate,async(req,res)=>{
    try {
        const buyuser = await User.findOne({_id:req.userID});
        if(buyuser){
        res.status(201).json(buyuser);
        }
        else{
            res.status(401).json({error:"invalid user"});
        }
    } catch (error) {
        // console.log("error" + error)
    }
})



// get valid user

router.get("/validuser",athenticate,async(req,res)=>{
    try {
        const validuserone = await User.findOne({_id:req.userID});
        res.status(201).json(validuserone);
    } catch (error) {
        // console.log("error" + error)
    }
})


// remove item from cart
router.delete("/remove/:id",athenticate,async(req,res)=>{
    try {
        const {id} = req.params;

        const removecartdata = req.rootUser.carts.filter((cruval)=>{
            return cruval.id == id;
        });

        req.rootUser.carts.remove(removecartdata[0]) 

        req.rootUser.save();
        res.status(201).json(req.rootUser);
        // console.log("item remove");
    } catch (error) {
        // console.log("error hain" + error);
        res.status(400).json(req.rootUser);
    }
})



// for user logout


router.get("/lougout",athenticate,(req,res)=>{
    try {
        req.rootUser.tokens = req.rootUser.tokens.filter((curelem)=>{
            return curelem.token !== req.token
        });


        res.clearCookie("Shopshop",{path:"/"});

        req.rootUser.save();
        res.status(201).json(req.rootUser.tokens); 
        // console.log("uuser logout");
    } catch (error) {
        // res.status(401).json(req.rootUser.toekns);
        // console.log("error for user logout");
    }
})



//checkout

router.post("/checkout",athenticate,async (req,res)=>{
    const {cartdata} = req.body;
    // console.log(cartdata)
    if(cartdata.length)
    {const data_buy = cartdata.map((e)=>{
        return {price_data:{
            currency:"inr",
            product_data:{
                
                
                name:e.title.longTitle,
                images:[e.url],

                description:e.description,
                metadata:{
        
                    id:e.id
                }
            },
            unit_amount:e.price.cost*100,
            
        },
        quantity:1,
        
  

    }

    })
    
    const customer = await stripe.customers.create({
        name: 'Jenny Rosen',
        address: {
          line1: '510 Townsend St',
          postal_code: '98140',
          city: 'San Francisco',
          state: 'CA',
          country: 'US',
        },
      });
      
    const session = await stripe.checkout.sessions.create({
        payment_method_types:["card"],
        customer:customer.id,
        line_items:data_buy,
        mode:"payment",
        success_url:`${process.env.BASE_URL}/success`,
        cancel_url:`${process.env.BASE_URL}/cancel`

    })
    res.status(201).json({id:session.id})

}
})




//success cart

router.delete("/successcart",athenticate,async(req,res)=>{
    if(req.rootUser){try {

        req.rootUser.carts = [];

        req.rootUser.save();
        res.status(201).json(req.rootUser);
        // console.log("item remove");
    } catch (error) {
        // console.log("error hain" + error);
        res.status(400).json(req.rootUser);
    }}
})


module.exports = router;