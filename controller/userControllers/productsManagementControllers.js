const mongoose = require("mongoose");
const userCollection = require("../../model/userSchema");
const productCollection = require("../../model/productSchema");
const categoryCollection = require("../../model/categorySchema");
const cartCollection = require("../../model/cartSchema");
const brandSchema = require("../../model/brandSchema");
const wishlistCollection = require('../../model/wishlistSchema');
require("dotenv").config();

module.exports = {
    getProductListing: async (req, res, next) => {
        try {
          const paginationData = req.paginationData;
          const previousPage = paginationData.previousPage;
          const nextPage = paginationData.nextPage;
          const currentPage = paginationData.currentPage;
          const limit = paginationData.limit;
    
          //const products = await productCollection.find().lean();
          const products = await productCollection.find().populate('category').populate('brandName')
          .skip((currentPage-1) * limit)
          .limit(limit)
          .lean();
          const categories = await categoryCollection.find().lean();
          const brands = await brandSchema.find().lean();
          res.render("user/productList", {
            title: "Products",
            products,
            loginName: req.session.username,
            previousPage,
            currentPage,
            nextPage,
            categories,
            brands
          });
        } catch (error) {
          console.log("Error!! : ", error);
        }
      },
    
    productListingPagination: async(req,res)=>{
        try {
          const paginationData = req.paginationData;
          const previousPage = paginationData.previousPage;
          const nextPage = paginationData.nextPage;
          const currentPage = paginationData.currentPage;
          const limit = paginationData.limit;
    
          const products = await productCollection.find().populate('category').populate('brandName')
          .skip((currentPage-1) * limit)
          .limit(limit)
          .lean();
          console.log("products in pagination: ",products);
          const data = {products:products,previousPage:previousPage,currentPage:currentPage,nextPage:nextPage};
          res.json(data);
        } catch (error) {
          console.log("Error while products pagination: ",error.message);
        }
    },
    
    getProductDetails: async (req, res) => {
        try {
          // converting this string id into object id
          const objectId = new mongoose.Types.ObjectId(req.params.id);
          console.log("objectId:",objectId)
          const product = await productCollection.findById(objectId).populate('brandName').lean();
          const user = await userCollection.findOne({email:req.session.userid});
          const userId = user._id;
          const cart = await cartCollection.findOne({userId});
          const wishlist = await wishlistCollection.findOne({user:userId});
          console.log("wishlist:",wishlist);
          let productExistInWishlist = null;
          if(wishlist){
            productExistInWishlist = wishlist.products.find(product => product.productId.toString() === objectId.toString());
          }
          console.log("productExistInWishlist:",productExistInWishlist);
          if(cart){
            const existingProduct = cart.products.find(product => product.productId.toString() === objectId.toString());
            
            if(existingProduct){
              const quantity = existingProduct.quantity;
              // checking if product is in stock
              let isInStock = product.stock > quantity
              return res.render("user/productDetails", {
                title: "Product Details",
                product,
                loginName: req.session.username,
                isInStock,
                productExistInWishlist,
                itemInCart:true
              });
            }
          }
          let isInStock = product.stock > 0
          res.render("user/productDetails", {
            title: "Product Details",
            product,
            loginName: req.session.username,
            isInStock,
            productExistInWishlist,
            itemInCart:false
          });
          
        } catch (error) {
          console.log("Error!!: ", error);
        }
    },
    
      // product filtering
    filterProducts: async (req, res, next) => {
    
        const filteredProducts = req.data.filteredProducts;
        //console.log("req.data.filteredProducts:",req.data.filteredProducts);
        const previousPage = req.data.previousPage;
        const nextPage = req.data.nextPage;
        const currentPage = req.data.currentPage;
    
        //console.log("query: ",query);
        try {
          const data = {filteredProducts:filteredProducts,previousPage:previousPage,nextPage:nextPage,currentPage:currentPage}
          res.json(data);
          // console.log("Filtered products: ",filteredProducs);
          
        } catch (error) {
          console.log("Error occured while sorting: ", error.message);
        }
    },
}