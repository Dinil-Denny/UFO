const categoryCollection = require('../../model/categorySchema');
const productCollection = require('../../model/productSchema');
const brandNameCollection = require('../../model/brandSchema');
const mongoose = require('mongoose');
const sharp = require('sharp');
const fs = require('fs');

module.exports = {
    productList: async(req,res)=>{
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
            res.render('admin/productList',{admin:true, adminName:req.session.admin, title:"Products",products,previousPage,currentPage,nextPage});
                
        } catch (error) {
            console.log(`An error occured : ${error}`);
            res.render('admin/adminError',{title:"Error",admin:true,adminName:req.session.admin});
        }
    },

    productListPagination: async(req,res)=>{
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
            const data = {products:products,previousPage:previousPage,nextPage:nextPage,currentPage:currentPage};
            res.json(data);
        } catch (error) {
            console.log("Error while paginatin: ",error.message);
            res.render('admin/adminError',{title:"Error",admin:true,adminName:req.session.admin});
        }
    },
    getAddProduct: async(req,res)=>{
        try {
            const categories = await categoryCollection.find({}).lean();
            const brands = await brandNameCollection.find().lean();
            res.render('admin/addProducts',{admin:true, adminName:req.session.admin, title:"Add Products", categories,brands});
        } catch (err) {
            if(err){
                console.log(`An error occured : ${err.message}`);
                res.render('admin/adminError',{title:"Error",admin:true,adminName:req.session.admin});
            }  
        }
    },
    
    postAddProducts: async(req,res)=>{
        try {
            const {productName, brandName, description, gender, price, offerPrice, size, color, stock, category} = req.body;
            
            // creating a new product document
            const product = new productCollection({
                productName,
                brandName,
                description,
                gender,
                price : parseFloat(price),
                offerPrice : parseFloat(offerPrice),
                size,
                color,
                stock : parseInt(stock),
                category,
                images: [], 
            });

            // resizing and save uploaded images
            if(req.files){
                for(const file of req.files){
                    const resizeImg = await sharp(file.path)
                    .resize({width:450, height: 550, fit: sharp.fit.fill})
                    .toBuffer();
                    const uniqueFilename = file.originalname.replace(/\.[^.]+$/, `-${Date.now()}${file.originalname.match(/\.[^.]+$/)}`);
                    const imgURL = `/images/imgUploads/${uniqueFilename}`;
                    await sharp(resizeImg).toFile(`public/images/imgUploads/${uniqueFilename}`);
                    product.images.push(imgURL);
                }
            }
            await product.save();
            res.redirect('/admin/products');
        } catch (err) {
            if(err){
                console.log(`An error occured!: ${err}`);
                res.render('admin/adminError',{title:"Error",admin:true,adminName:req.session.admin});
            }
        }
    },
    postAddBrand : async(req,res,next)=>{
        try {
            const {brandName} = req.body;
            const categories = await categoryCollection.find().lean();
            const brands = await brandNameCollection.find().lean();
            const brandExist = await brandNameCollection.findOne({brandName:{$regex:new RegExp("^"+brandName+"$","i")}});  
            if(!brandExist){
                const brand = new brandNameCollection({
                    brandName
                });
                await brand.save();
                return res.redirect('/admin/addProduct');
            }
            res.render('admin/addProducts',{admin:true, adminName:req.session.admin, title:"Add Products", categories,brands,brandAddErrorMessage:"Brand already exists"});
        } catch (error) {
            console.log("Error while adding brand: ",error.message);
            res.render('admin/adminError',{title:"Error",admin:true,adminName:req.session.admin});
        }
    },

    getEditPorducts:async(req,res)=>{
        try{
            const product = await productCollection.findById(req.params.id).populate('brandName').lean();
            const brands = await brandNameCollection.find().lean();
            // fetching category information
            const categories = await categoryCollection.find().lean();
            const category = await categoryCollection.findById(product.category).lean();
            res.render('admin/editProduct',{admin:true, adminName:req.session.admin,title:"Edit Product",product,category,categories,brands});
        }catch(err){
            console.log("Unexpected error occured: ",err);
            res.render('admin/adminError',{title:"Error",admin:true,adminName:req.session.admin});
        }
    },
    postEditProducts: async(req,res)=>{
        try {
            const productId = req.params.id;
            const {productName, brandName, description, gender, price, offerPrice, size, color, stock, category,removeImages} = req.body;
            const product = await productCollection.findById(productId);

            product.productName = productName;
            product.brandName = brandName;
            product.description = description;
            product.gender = gender;
            product.price = parseFloat(price);
            product.offerPrice = parseFloat(offerPrice);
            product.size = size;
            product.color = color;
            product.stock = parseInt(stock);
            product.category = category;

            // ensuring removeImages is an array
            Array.isArray(removeImages) ? removeImages : [removeImages];

            // removing images
            if(removeImages && removeImages.length){
                for(const image of removeImages){
                    //deleting the image file from the server folder using the fs.unlik method
                    fs.unlink('public/'+image,(err)=>{
                        if(err) console.log (err);
                        else console.log("image removed from server folder");
                    })
                    const imgIndex = product.images.indexOf(image);
                    if(imgIndex !== -1){
                        product.images.splice(imgIndex,1);
                    }
                }
            }

            // new image upload - after cropping and resizing
            if(req.files){
                for(const file of req.files){
                    const resizeImg = await sharp(file.path)
                    .resize({width:450, height: 550, fit: sharp.fit.fill})
                    .toBuffer();
                    const uniqueFilename = file.originalname.replace(/\.[^.]+$/, `-${Date.now()}${file.originalname.match(/\.[^.]+$/)}`);
                    const imgURL = `/images/imgUploads/${uniqueFilename}`;
                    await sharp(resizeImg).toFile(`public/images/imgUploads/${uniqueFilename}`);
                    product.images.push(imgURL);
                }
            }
            await product.save();
            res.redirect('/admin/products')
        } catch (error) {
            console.log("An error occured: ",error.message);
            res.render('admin/adminError',{title:"Error",admin:true,adminName:req.session.admin});
        }
    },

    blockProducts:async(req,res)=>{
        try{
            const id= req.params.id;
            const product = await productCollection.findById(id);
            if(!product.active){
                await productCollection.findByIdAndUpdate(req.params.id, {active:true});
                res.redirect('/admin/products');
            }
            if(product.active){
                await productCollection.findByIdAndUpdate(req.params.id, {active:false});
                res.redirect('/admin/products');
            }
        }catch(err){
            console.log("An error occured: ",err);
            res.render('admin/adminError',{title:"Error",admin:true,adminName:req.session.admin});
        }
    },
    deleteProducts: async(req,res)=>{
        try{
            const id = req.params.id;
            await productCollection.findByIdAndDelete(id);
            res.redirect('/admin/products');
        }catch(err){
            console.log("Error while deleting product: ",err.message);
            res.render('admin/adminError',{title:"Error",admin:true,adminName:req.session.admin});
        }
    }
}