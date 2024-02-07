// const express = require('express');
// const bcrypt = require('bcrypt');
// const router = express.Router();
// const adminCollection = require('../../model/adminSchema');

// //get admin register page
// router.get('/',(req,res,next)=>{
//     res.render('admin/adminRegister',{admin:true})
// }) 
// // post admin register details
// router.post('/',async(req,res,next)=>{
//     const{name,email,password} = req.body;
//     try{
//         if(!email || !password ||!name){
//             res.render('admin/adminRegister',{admin:true, message:"Enter full details"});
//         }
//         const adminExist = await adminCollection.findOne({email})
//         if(adminExist){
//             res.render('admin/adminRegister',{admin:true, message:"Email already registered"});
//         }
//         let hashedAdminPassword = await bcrypt.hash(password,10);
//         const adminData = {
//             name ,
//             email ,
//             password : hashedAdminPassword
//         }
//         console.log(adminData);
//         await adminCollection.insertMany([adminData]);
//         res.render('admin/adminLogin');

//     }catch(err){
//         console.log("An error occured "+err);
//         res.render('admin/adminRegister',{admin:true, message:"Something went wrong"});
//     }
// })

// module.exports = router;
