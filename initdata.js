const Products = require("./Model/productmodel");
const productsdata = require("./productdata");


const initdata = async()=>{
    try {

        await Products.deleteMany({});

        const storeData = await Products.insertMany(productsdata);
        // console.log(storeData);
    } catch (error) {
        // console.log("error"+ error.message);
    }
};


module.exports = initdata;