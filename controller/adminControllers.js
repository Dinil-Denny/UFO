
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const userCollection = require('../model/userSchema');
const adminCollection = require('../model/adminSchema');
const categoryCollection = require('../model/categorySchema');
const productCollection = require('../model/productSchema');
const sharp = require('sharp');

let admin = null;
module.exports = {
    getDashboard : async(req,res,next)=>{
        let session = req.session;
        try{
            if(session.adminid){
                res.render('admin/adminDashboard',{admin:true, adminName:admin,title:"Admin_Dashboard"});
            }else{
                res.render('admin/adminLogin',{admin:true,title:"Admin_Login"});
            }
        }catch(err){
            console.log("Error !! "+err);
        } 
    },
    getUserList : async(req,res,next)=>{
        try {
            const userList = await userCollection.find({}).lean();
            res.render('admin/adminCustomers',{admin:true, userList, adminName:admin,title:"User_List"});
            
        } catch (error) {
            console.log("Error: ",error);
        }
        
    },
    blockUser : async(req,res,next)=>{
        try {
            const id= req.params.id;
            console.log(id);
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
            console.log("adminExist: "+adminExist);
            if(!adminExist){
                return res.render('admin/adminLogin',{admin: true , message: "Email not found! Check once again",title:"Admin_Login"});
            } 
            const match = await bcrypt.compare(password,adminExist.password);
            if(!match)
            {
                return res.render('admin/adminLogin',{admin: true , message: "Incorrect password",title:"Admin_Login"});
            }
            req.session.adminid = req.body.email;
            admin = adminExist.name;
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
            res.render('admin/addCategory',{categoryList,admin:true,adminName:admin,title:"Category"});
        }catch(err){
            console.log(`Error occured!! : ${err.message}`);
        }
    },
     postAddCatagory: async(req,res)=>{
        try{
            const {catagoryName,description} = req.body;
            console.log(req.body);
            // const categoryExists = await categoryCollection.findOne({catagoryName});
             const categoryExists = await categoryCollection.findOne({
                catagoryName:{$regex:new RegExp("^"+catagoryName+"$","i")}
            });
            console.log("category: ",categoryExists);
            if(!categoryExists){
                const categoryData = {
                    catagoryName,
                    description
                }
                await categoryCollection.insertMany([categoryData]);
                res.redirect('/admin/category');
            }
            const categoryList = await categoryCollection.find({}).lean();
            res.render('admin/addCategory',{admin:true, adminName:admin, message:"Category already exists!", title:"Category",categoryList});
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
                console.log("category: "+category)
                res.render('admin/editCategory',{admin:true,adminName:admin,title:"Edit Category",category});
            } catch (error) {
                console.log("Error !: ",error);
            }
        },

        postEditCategory: async(req,res)=>{
            try{
                const {catagoryName,description} = req.body;
                console.log("req.body: ",req.body);
                console.log("req.params.id: ",req.params.id);
                const category = await categoryCollection.findById(req.params.id).lean();
                const categoryIdToExclude = new mongoose.Types.ObjectId(req.params.id);
                const categoryExist = await categoryCollection.findOne({
                    catagoryName:{$regex:new RegExp("^"+catagoryName+"$","i")},
                    _id:{$ne:categoryIdToExclude}
                });
                
                console.log("categoryExist: ",categoryExist);
                if(!categoryExist){
                    await categoryCollection.findByIdAndUpdate(req.params.id,{catagoryName,description});
                    res.redirect('/admin/category');  
                }
                res.render('admin/editCategory',{admin:true,adminName:admin,title:"Edit Category",message:"Category name already exists.",category});
                
            }catch(err){
                console.log(`An error occured:- ${err}`);   
            }
        },

        productList: async(req,res)=>{
            try {
                const products = await productCollection.find().lean();
                // getting only category names
                const categories = await categoryCollection.find({},'catagoryName').lean();
                // map product id to category name
                const productMap = {};
                categories.forEach(category => productMap[category._id]= category.catagoryName);
                // Add category names to product objects
                products.forEach(product => product.catagoryName= productMap[product.category]);
                // console.log("products: ",products);
                res.render('admin/productList',{admin:true, adminName:admin, title:"Products",products});
            } catch (error) {
                console.log(`An error occured : ${error}`);
            }
            
        },
        getAddProduct: async(req,res)=>{
            try {
                const categories = await categoryCollection.find({}).lean();
                res.render('admin/addProducts',{admin:true, adminName:admin, title:"Add Products", categories});
            } catch (err) {
                if(err)
                    console.log(`An error occured : ${err.message}`);
            }
        },
        
        postAddProducts: async(req,res)=>{
            try {
                console.log("post addproducts");
                const {productName, brandName, description, gender, price, offerPrice, size, color, stock, category} = req.body;
                console.log("req.body : ",req.body);
                
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
                console.log("Product : ",product);

                // resizing and save uploaded images
                if(req.files){
                    console.log("got req.files: ",req.files);
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
                res.redirect('/admin/products');
            } catch (err) {
                if(err)console.log(`An error occured!: ${err}`);
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
                
                res.render('admin/editProduct',{admin:true, adminName:admin,title:"Edit Product",product,category,categories});
            }catch(err){
                console.log("Unexpected error occured: ",err);
            }
        },
        postEditProducts: async(req,res)=>{
            try {
                console.log("req.body: ",req.body);
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
                    console.log("removeImages: ",removeImages);
                    console.log("removeImages.length: ",removeImages.length);
                    for(const image of removeImages){
                        console.log("image: ",image);
                        const imgIndex = product.images.indexOf(image);
                        console.log("imgIndex: ",imgIndex);
                        if(imgIndex !== -1){
                            product.images.splice(imgIndex,1);
                        }
                    }
                }

                // new image upload - after cropping and resizing
                if(req.files){
                    console.log("got req.files: ",req.files);
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
                console.log("product :- ",product);
                res.redirect('/admin/products')
            } catch (error) {
                console.log("An error occured: ",error);
            }
        },

        blockProducts:async(req,res)=>{
            try{
                const id= req.params.id;
                console.log(id);
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