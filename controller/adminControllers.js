const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const userCollection = require('../model/userSchema');
const adminCollection = require('../model/adminSchema');

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
        const userList = await userCollection.find({}).lean();
        res.render('admin/adminCustomers',{admin:true, userList, adminName:admin,title:"User_List"});
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
            console.log("adminExist "+adminExist);
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
            res.render('admin/adminDashboard',{admin:true ,adminName : admin,title:"Admin_Login",title:"Admin_Dashboard"});
        }catch(err){
            console.log("error...!!! "+err.message);
        }
    },
    adminLogout: async(req,res,next)=>{
        await req.session.desroy();
        res.redirect('/admin/login',{admin:true,title:"Admin_Login"});
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
        }
}