// const express = require('express');
// const router = express.Router();
// const bcrypt = require('bcrypt'); 
// const userCollection = require('../../model/userSchema')


// /* GET users register form. */
// router.get('/', function(req, res, next) {
//   res.render('user/userRegister');
// });

// // posting user data to db
// router.post('/',async(req,res)=>{
//   try{
//     const{name,email,mobilenumber,password} = req.body;
//     if(!name || !email || !mobilenumber || !password){
//       res.render('user/userRegister',{ message: 'Enter full details'});
//     }
//     // checking if the user is already registered
//     const userExist = await userCollection.findOne({email});
//     if(userExist){
//       res.render('user/userRegister',{ message: 'Email already registered'});
//     }
//     // hashing password
//       const hashedPassword = await bcrypt.hash(password,10);
//     // saving user in db
//       const userData = {
//         name ,
//         email ,
//         mobilenumber ,
//         password : hashedPassword
//       }
//       console.log(userData);
//       await userCollection.insertMany([userData]);
//       res.render('user/userLogin');
  
//   }catch(err){
//     console.error("An error occured :"+err);
//     res.render('user/userRegister',{message: "Something went wrong....!"});
//   }
// })

// module.exports = router;
