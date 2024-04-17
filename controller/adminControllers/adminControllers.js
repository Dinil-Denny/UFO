const bcrypt = require('bcrypt');
const adminCollection = require('../../model/adminSchema');

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
}