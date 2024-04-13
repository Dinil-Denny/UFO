const mongoose = require("mongoose");
const userCollection = require("../model/userSchema");
const productCollection = require("../model/productSchema");
const categoryCollection = require("../model/categorySchema");
const cartCollection = require("../model/cartSchema");
const brandSchema = require("../model/brandSchema");
const wishlistCollection = require('../model/wishlistSchema');
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
                productExistInWishlist
              });
            }
          }
          let isInStock = product.stock > 0
          res.render("user/productDetails", {
            title: "Product Details",
            product,
            loginName: req.session.username,
            isInStock,
            productExistInWishlist
          });
          
        } catch (error) {
          console.log("Error!!: ", error);
        }
    },
    
      // product filtering
    filterProducts: async (req, res, next) => {
    
        const filteredProducts = req.filteredProducts;
        const paginationData = req.paginationData;
        const previousPage = paginationData.previousPage;
        const nextPage = paginationData.nextPage;
        const currentPage = paginationData.currentPage;
        const limit = paginationData.limit;
    
        // // filter based on gender
        // if(Array.isArray(filters.gender)){
        //   query.gender = {$in : filters.gender};
        // }else if(filters.gender){
        //   query.gender = filters.gender;
        // }
    
        // // filter based on brand name
        // if(Array.isArray(filters.brand)){
        //   query.brandName = {$in : filters.brand};
        // }else if(filters.brand){
        //   query.brandName = filters.brand;
        // }
          
        // // filter on price
        // if(Array.isArray(filters.offerPrice)){
        //   const parsedPriceFilter = filters.offerPrice.map(value => parseInt(value));
        //   query.offerPrice = {$gte: Math.min(...parsedPriceFilter),$lte:Math.max(...parsedPriceFilter)+500}
        // }else if(filters.offerPrice){
        //   if(filters.offerPrice === '3000') 
        //   query.offerPrice = {$gte:Number(filters.offerPrice)}
        //   else
        //   query.offerPrice = {$gte:Number(filters.offerPrice),$lte:Number(filters.offerPrice)+500}
        // }
    
        //console.log("query: ",query);
        try {
          // if(filters.sort){
          //   const filteredProducs = await productCollection.find(query).populate('category').populate('brandName').sort({offerPrice:Number(filters.sort)}).skip((currentPage-1) * limit).limit(limit).lean();
          //   //const data = {filteredProducs:filteredProducs,previousPage:previousPage,nextPage:nextPage,currentPage:currentPage}
          //   res.send(filteredProducs);
          // }else{
          //   const filteredProducs = await productCollection.find(query).populate('category').populate('brandName').skip((currentPage-1) * limit).limit(limit).lean();
          //   //const data = {filteredProducs:filteredProducs,previousPage:previousPage,nextPage:nextPage,currentPage:currentPage}
          //   res.send(filteredProducs);
          // }
          const data = {filteredProducts:filteredProducts,previousPage:previousPage,nextPage:nextPage,currentPage:currentPage}
          res.json(data)
          // console.log("Filtered products: ",filteredProducs);
          
        } catch (error) {
          console.log("Error occured while sorting: ", error.message);
        }
    },
    
    searchProducts:async(req,res)=>{
        try {
          console.log("search: ",req.query);
          const {search} = req.query;
    
          const paginationData = req.paginationData;
          const previousPage = paginationData.previousPage;
          const nextPage = paginationData.nextPage;
          const currentPage = paginationData.currentPage;
          const limit = paginationData.limit;
    
          const categories = await categoryCollection.find().lean();
          const brands = await brandSchema.find().lean();
          const category = await categoryCollection.findOne({catagoryName:{$regex : search, $options:'i'}});
          console.log("category:",category);
          const brand = await brandSchema.findOne({brandName:{$regex: search,$options:'i'}});
          console.log("brand:",brand);
          let query = {}
    
          if(category){
            query = {
                $or:[
                  {productName: {$regex: search,$options: 'i'}},
                  {description: {$regex: search,$options: 'i'}},
                  {category: category._id},
                  {gender: {$regex: search,$options: 'i'}},
                  {color: {$regex: search,$options: 'i'}}
                ]
            }
            console.log("query:",query);
          }else if(brand){
            query = {
              $or:[
                {productName: {$regex: search,$options: 'i'}},
                {description: {$regex: search,$options: 'i'}},
                {gender: {$regex: search,$options: 'i'}},
                {color: {$regex: search,$options: 'i'}},
                {brandName: brand._id}
              ]
            }
          }else{
            query = {
              $or:[
                {productName: {$regex: search,$options: 'i'}},
                {description: {$regex: search,$options: 'i'}},
                {gender: {$regex: search,$options: 'i'}},
                {color: {$regex: search,$options: 'i'}}
              ]
            }
            console.log("query: ",query);
          }
          const products = await productCollection.find(query).populate('category').populate('brandName')
          .skip((currentPage-1) * limit)
          .limit(limit)
          .lean();
          console.log("prouduct: ",products);
          console.log(products.length);
          res.render('user/productList',{title:"Products",products,
          loginName: req.session.username,
          previousPage,
          currentPage,
          nextPage,
          categories,
          brands,
          search});
        } catch (error) {
          console.log("Error while searching:",error);
        }
    }
}