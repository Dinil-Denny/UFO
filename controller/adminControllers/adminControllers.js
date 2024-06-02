const bcrypt = require('bcrypt');
const userCollection = require('../../model/userSchema');
const adminCollection = require('../../model/adminSchema');
const orderCollection = require('../../model/orderSchema');

module.exports = {
    getAdminLogin : (req,res,next)=>{
        try{
            res.render('admin/adminLogin',{admin:true,title:"Admin_Login"});
        }catch(err){
            console.log("Error! : ",err);
            res.render('admin/adminError',{title:"Error",admin:true,adminName:req.session.admin});
        }
    },
    postAdminLogin : async(req,res,next)=>{
        const {email,password} = req.body;
        try{
            if(!email || !password){
                return res.render('admin/adminLogin',{admin: true , message: "Email and Password required",title:"Admin_Login"});
            } 
            const adminExist = await adminCollection.findOne({email});
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
            res.redirect('/admin');
        }catch(err){
            console.log("error...!!! "+err.message);
            res.render('admin/adminError',{title:"Error",admin:true,adminName:req.session.admin});
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
            res.render('admin/adminError',{title:"Error",admin:true,adminName:req.session.admin});
        }
    },
}