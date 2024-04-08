
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const userCollection = require('../model/userSchema');
const adminCollection = require('../model/adminSchema');
const categoryCollection = require('../model/categorySchema');
const productCollection = require('../model/productSchema');
const brandNameCollection = require('../model/brandSchema');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path')

module.exports = {
    getDashboard : async(req,res,next)=>{
        let session = req.session;
        try{
            if(session.adminid){
                res.render('admin/adminDashboard',{admin:true, adminName:req.session.admin,title:"Admin_Dashboard"});
            }else{
                res.render('admin/adminLogin',{admin:true,title:"Admin_Login"});
            }
        }catch(err){
            console.log("Error !! "+err);
        } 
    },
    getUserList : async(req,res,next)=>{
        try {
            const userList = await userCollection.find({}).sort({createdAt:-1}).lean();
            res.render('admin/adminCustomers',{admin:true, userList, adminName:req.session.admin,title:"User_List"});
            
        } catch (error) {
            console.log("Error: ",error);
        }
        
    },
    blockUser : async(req,res,next)=>{
        try {
            const id= req.params.id;
            const user = await userCollection.findById(req.params.id);
            if(!user.blocked){
                await userCollection.findByIdAndUpdate(req.params.id, {blocked:true});
                // const user = await userCollection.findById(req.params.id);
                // console.log(user.blocked);
                res.redirect('/admin/customers');
            }
            if(user.blocked){
                await userCollection.findByIdAndUpdate(req.params.id, {blocked:false});
                // const user = await userCollection.findById(req.params.id);
                // console.log(user.blocked);
                res.redirect('/admin/customers');
            } 
        } catch (error) {
            console.log("Error! : ",err);
        }
        
    },
    getAdminLogin : (req,res,next)=>{
        try{
            res.render('admin/adminLogin',{admin:true,title:"Admin_Login"});
        }catch(err){
            console.log("Error! : ",err);
        }
            
    },
    postAdminLogin : async(req,res,next)=>{
        const {email,password} = req.body;
        // console.log(email,password);
        try{
            if(!email || !password){
                return res.render('admin/adminLogin',{admin: true , message: "Email and Password required",title:"Admin_Login"});
            } 
            const adminExist = await adminCollection.findOne({email});
            // console.log("adminExist: "+adminExist);
            if(!adminExist){
                return res.render('admin/adminLogin',{admin: true , message: "Email not found! Check once again",title:"Admin_Login"});
            } 
            const match = await bcrypt.compare(password,adminExist.password);
            if(!match)
            {
                return res.render('admin/adminLogin',{admin: true , message: "Incorrect password",title:"Admin_Login"});
            }
            req.session.adminid = req.body.email;
            req.session.admin = adminExist.name;
            res.redirect('/admin')
            // res.render('admin/adminDashboard',{admin:true, adminName:admin, title:"Admin_Login",title:"Admin_Dashboard"});
        }catch(err){
            console.log("error...!!! "+err.message);
        }
    },
    adminLogout:async(req,res,next)=>{
        try{
            req.sessionStore.destroy(req.session.adminid,(err)=>{
                if(err) console.log("error while destroying admin session",err);
                else res.render('admin/adminLogin',{admin:true});
            });
        }catch(err){
            console.log("Error !! - ",err);
        }
        
    },
     getAddCatagory: async(req,res)=>{
        try{
            const categoryList = await categoryCollection.find({}).lean();
            res.render('admin/addCategory',{categoryList,admin:true,adminName:req.session.admin,title:"Category"});
        }catch(err){
            console.log(`Error occured!! : ${err.message}`);
        }
    },
     postAddCatagory: async(req,res)=>{
        try{
            const {catagoryName,description} = req.body;
            // const categoryExists = await categoryCollection.findOne({catagoryName});
             const categoryExists = await categoryCollection.findOne({
                catagoryName:{$regex:new RegExp("^"+catagoryName+"$","i")}
            });
            if(!categoryExists){
                const categoryData = {
                    catagoryName,
                    description
                }
                await categoryCollection.insertMany([categoryData]);
                res.redirect('/admin/category');
            }
            const categoryList = await categoryCollection.find({}).lean();
            res.render('admin/addCategory',{admin:true, adminName:req.session.admin, message:"Category already exists!", title:"Category",categoryList});
        }catch(err){
            console.log(`An error occured: ${err.message}`);
        }
    },
        
        deleteCategory:async(req,res)=>{
            try {
                await categoryCollection.findByIdAndDelete(req.params.id);
                res.redirect('/admin/category');
            } catch (error) {
                console.log(`An error occured: ${err.message}`);
            }
            
        },

        getEditCategory: async(req,res)=>{
            try {
                const category = await categoryCollection.findById(req.params.id).lean();
                
                res.render('admin/editCategory',{admin:true,adminName:req.session.admin,title:"Edit Category",category});
            } catch (error) {
                console.log("Error !: ",error);
            }
        },

        postEditCategory: async(req,res)=>{
            try{
                const {catagoryName,description} = req.body;
                const category = await categoryCollection.findById(req.params.id).lean();
                const categoryIdToExclude = new mongoose.Types.ObjectId(req.params.id);
                const categoryExist = await categoryCollection.findOne({
                    catagoryName:{$regex:new RegExp("^"+catagoryName+"$","i")},
                    _id:{$ne:categoryIdToExclude}
                });
                
                
                if(!categoryExist){
                    await categoryCollection.findByIdAndUpdate(req.params.id,{catagoryName,description});
                    res.redirect('/admin/category');  
                }
                res.render('admin/editCategory',{admin:true,adminName:req.session.admin,title:"Edit Category",message:"Category name already exists.",category});
                
            }catch(err){
                console.log(`An error occured:- ${err}`);   
            }
        },

        productList: async(req,res)=>{
            try {
                // const currentPage = parseInt(req.query.page) || 1;
                // console.log("currentPage: ",currentPage);
                // const limit = 4 ; //items per page
                // const totalProductsCount = await productCollection.countDocuments();
                // console.log("totalProducts: ",totalProductsCount);
                // const totalPages = Math.ceil(totalProductsCount/limit);
                // console.log("total pages: ",totalPages);
                // const previousPage = currentPage>1 ? currentPage-1 : null;
                // console.log("previous page: ",previousPage);
                // const nextPage = currentPage<totalPages ? currentPage+1 : null;
                // console.log("next page: ",nextPage);

                const paginationData = req.paginationData;
                const previousPage = paginationData.previousPage;
                const nextPage = paginationData.nextPage;
                const currentPage = paginationData.currentPage;
                const limit = paginationData.limit;

                const products = await productCollection.find().populate('category').populate('brandName')
                .skip((currentPage-1) * limit)
                .limit(limit)
                .lean();
                // console.log(products);
                res.render('admin/productList',{admin:true, adminName:req.session.admin, title:"Products",products,previousPage,currentPage,nextPage});
                
            } catch (error) {
                console.log(`An error occured : ${error}`);
            }
            
        },

        productListPagination: async(req,res)=>{
            try {
                // const currentPage = parseInt(req.query.page) || 1;
                // console.log("currentPage: ",currentPage);
                // const limit = 4 ; //items per page
                // const totalProductsCount = await productCollection.countDocuments();
                // console.log("totalProducts: ",totalProductsCount);
                // const totalPages = Math.ceil(totalProductsCount/limit);
                // console.log("total pages: ",totalPages);
                // const previousPage = currentPage>1 ? currentPage-1 : null;
                // console.log("previous page: ",previousPage);
                // const nextPage = currentPage<totalPages ? currentPage+1 : null;
                // console.log("next page: ",nextPage);

                const paginationData = req.paginationData;
                const previousPage = paginationData.previousPage;
                const nextPage = paginationData.nextPage;
                const currentPage = paginationData.currentPage;
                const limit = paginationData.limit;
                
                const products = await productCollection.find().populate('category').populate('brandName')
                .skip((currentPage-1) * limit)
                .limit(limit)
                .lean();
                // console.log(products);
                const data = {products:products,previousPage:previousPage,nextPage:nextPage,currentPage:currentPage};
                console.log("data:",data);
                res.json(data);
            } catch (error) {
                console.log("Error while paginatin: ",error.message);
            }
        },

        getAddProduct: async(req,res)=>{
            try {
                const categories = await categoryCollection.find({}).lean();
                const brands = await brandNameCollection.find().lean();
                console.log("brands:",brands);
                res.render('admin/addProducts',{admin:true, adminName:req.session.admin, title:"Add Products", categories,brands});
            } catch (err) {
                if(err)
                    console.log(`An error occured : ${err.message}`);
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
                // console.log("Product : ",product);

                // resizing and save uploaded images
                if(req.files){
                    // console.log("got req.files: ",req.files);
                    for(const file of req.files){
                        const resizeImg = await sharp(file.path)
                        .resize({width:450, height: 550, fit: sharp.fit.fill})
                        .toBuffer();
                        const uniqueFilename = file.originalname.replace(/\.[^.]+$/, `-${Date.now()}${file.originalname.match(/\.[^.]+$/)}`);
                        const imgURL = `/images/imgUploads/${uniqueFilename}`;
                        await sharp(resizeImg).toFile(`public/images/imgUploads/${uniqueFilename}`);
                        product.images.push(imgURL);
                        // console.log("imgs pushed to array");
                    }
                }
                await product.save();
                res.redirect('/admin/products');
            } catch (err) {
                if(err)console.log(`An error occured!: ${err}`);
            }
        },
        postAddBrand : async(req,res,next)=>{
            try {
                const {brandName} = req.body;
                console.log("brandName:",brandName);
                const categories = await categoryCollection.find().lean();
                const brands = await brandNameCollection.find().lean();
                const brandExist = await brandNameCollection.findOne({brandName:{$regex:new RegExp("^"+brandName+"$","i")}});  
                console.log("brandExists:",brandExist);
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
            }
        },

        getEditPorducts:async(req,res)=>{
            try{
                const product = await productCollection.findById(req.params.id).lean();
                // console.log("product: ",product);
                // fetching category information
                const categories = await categoryCollection.find().lean();
                const category = await categoryCollection.findById(product.category).lean();
                // console.log("category: ",category);
                
                res.render('admin/editProduct',{admin:true, adminName:req.session.admin,title:"Edit Product",product,category,categories});
            }catch(err){
                console.log("Unexpected error occured: ",err);
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
                        console.log("image: ",image);
                        ;
                        //deleting the image file from the server folder
                        fs.unlink('public/'+image,(err)=>{
                            if(err) console.log (err);
                            else console.log("image removed from server folder");
                        })
                        const imgIndex = product.images.indexOf(image);
                        console.log("imgIndex: ",imgIndex);
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
                        console.log("imgs pushed to array");
                    }
                }
                await product.save();
                res.redirect('/admin/products')
            } catch (error) {
                console.log("An error occured: ",error);
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
                console.log("An error occured: ",err)
            }
        },
        deleteProducts: async(req,res)=>{
            try{
                const id = req.params.id;
                await productCollection.findByIdAndDelete(id);
                res.redirect('/admin/products');
            }catch(err){
                console.log("Error while deleting product: ",err.message);
            }
        }

}