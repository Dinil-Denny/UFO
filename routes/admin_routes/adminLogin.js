// const express = require('express');
// const router = express.Router();
// const bcrypt = require('bcrypt');
// const adminCollection = require('../../model/adminSchema');

// // router.get('/',(req,res,next)=>{
// //     res.render('admin/adminLogin',{admin:true});
// // })

// router.post('/',async(req,res,next)=>{
//     const {email,password} = req.body;
//     console.log(email,password);
//     try{
//         if(!email || !password) res.render('admin/adminLogin',{admin: true , message: "Email and Password required"});
//         const adminExist = await adminCollection.findOne({email});
//         if(!adminExist) ('admin/adminLogin',{admin: true , message: "Email and Password required"});
//         const match = await bcrypt.compare(password,adminExist.password);
//         if(!match) ('admin/adminLogin',{admin: true , message: "Incorrect password"});
//         req.session.adminid = email;
//         res.render('admin/adminDashboard',{admin:true ,adminName : adminExist.name});
//     }catch(err){
//         console.log("error...!!! "+err);
//     }
// })



// module.exports = router;