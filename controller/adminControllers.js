const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
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
        let session = req.session;
        if(session.adminid){
            const userList = await userCollection.find({}).lean();
            res.render('admin/adminCustomers',{admin:true, userList, adminName:admin,title:"User_List"});
        }
    },
    blockUser : async(req,res,next)=>{
        const id= req.params.id;
        console.log(id);
        const user = await userCollection.findById(req.params.id);
        if(!user.blocked){
            await userCollection.findByIdAndUpdate(req.params.id, {blocked:true});
            // const user = await userCollection.findById(req.params.id);
            // console.log(user.blocked);
            res.send("User blocked");
        }
        if(user.blocked){
            await userCollection.findByIdAndUpdate(req.params.id, {blocked:false});
            // const user = await userCollection.findById(req.params.id);
            // console.log(user.blocked);
            res.send("User unblocked");
        }
    },
    getAdminLogin : (req,res,next)=>{
            res.render('admin/adminLogin',{admin:true,title:"Admin_Login"});
    },
    postAdminLogin : async(req,res,next)=>{
        const {email,password} = req.body;
        // console.log(email,password);
        try{
            if(!email || !password){
                res.render('admin/adminLogin',{admin: true , message: "Email and Password required",title:"Admin_Login"});
            } 
            const adminExist = await adminCollection.findOne({email});
            console.log("adminExist: "+adminExist);
            if(!adminExist){
                res.render('admin/adminLogin',{admin: true , message: "Email not found! Check once again",title:"Admin_Login"});
            } 
            const match = await bcrypt.compare(password,adminExist.password);
            if(!match)
            {
                res.render('admin/adminLogin',{admin: true , message: "Incorrect password",title:"Admin_Login"});
            }
            req.session.adminid = req.body.email;
            admin = adminExist.name
            res.render('admin/adminDashboard',{admin:true, adminName:admin, title:"Admin_Login",title:"Admin_Dashboard"});
        }catch(err){
            console.log("error...!!! "+err.message);
        }
    },
    adminLogout:async(req,res,next)=>{
        req.session.destroy();
        res.render('admin/adminLogin',{admin:true});
    },
        
   
    getAdminRegister : (req,res,next)=>{
        res.render('admin/adminRegister',{admin:true,title:"Admin_Register"})
    },
    postAdminRegister : async(req,res,next)=>{
            const{name,email,password} = req.body;
            try{
                if(!email ){
                    res.render('admin/adminRegister',{admin:true, message:"Email cannot be empty",title:"Admin_Register"});
                }
                else if(!password){
                    res.render('admin/adminRegister',{admin:true, message:"Password cannot be empty",title:"Admin_Register"});
                }
                else if(!name){
                    res.render('admin/adminRegister',{admin:true, message:"name cannot be empty",title:"Admin_Register"});
                }
                if(name && email && password){
                    const adminExist = await adminCollection.findOne({email})
                    if(adminExist){
                        res.render('admin/adminRegister',{admin:true, message:"Email already registered",title:"Admin_Register"});
                    }
                    let hashedAdminPassword = await bcrypt.hash(password,10);
                    const adminData = {
                        name ,
                        email ,
                        password : hashedAdminPassword
                    }
                    console.log(adminData);
                    await adminCollection.insertMany([adminData]);
                    res.render('admin/adminLogin',{admin:true,title:"Admin_Register",title:"Admin_Login"});
                }
                
            }catch(err){
                console.log("An error occured "+err);
                res.render('admin/adminRegister',{admin:true, message:"Something went wrong",title:"Admin_Register"});
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
                const categoryExists = await categoryCollection.findOne({catagoryName});
                console.log("category: "+categoryExists);
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
            await categoryCollection.findByIdAndDelete(req.params.id);
            res.redirect('/admin/category');
        },

        getEditCategory: async(req,res)=>{
            const category = await categoryCollection.findById(req.params.id).lean();
            console.log("category: "+category)
            res.render('admin/editCategory',{admin:true,adminName:admin,title:"Edit Category",category});
        },

        postEditCategory: async(req,res)=>{
            try{
                const {catagoryName,description} = req.body;
                await categoryCollection.findByIdAndUpdate(req.params.id,{catagoryName,description});
                res.redirect('/admin/category');
                // res.render('admin/addCategory',{admin:true,title:"Category",adminName:admin});
            }catch(err){
                console.log(`An error occured:- ${err}`);   
            }
        },

        productList: async(req,res)=>{
            try {
                const products = await productCollection.find({}).lean();
                res.render('admin/productList',{admin:true, adminName:admin, title:"Products",products});
            } catch (error) {
                console.log(`An error occured : ${err.message}`);
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
                console.log("req.body : "+JSON.stringify(req));
                const {productName, brandName, description, gender, price, offerPrice, size, color, stock, category} = req.body;
                console.log("req.body : "+req.body);
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
                    console.log("got req.files");
                    for(const file of req.files){
                        const resizeImg = await sharp(file.path)
                        .resize({width:500, height: 550, fit: sharp.fit.fill})
                        .toBuffer();
                        const uniqueFileName = file.oringinalname.replace(/\.[^.]+$/,`-${Date.now()}.${extname}`);
                        const imgURL = `/images/imgUploads/${uniqueFileName}`;
                        await sharp(resizeImg).toFile(`public/images/imgUploads/${uniqueFileName}`);
                        product.images.push(imgURL);
                    }
                }
                console.log("Product : "+product)
                await product.save();
                res.redirect('/admin/products');
            } catch (err) {
                if(err)console.log(`An error occured!: ${err}`);
            }
        }
}