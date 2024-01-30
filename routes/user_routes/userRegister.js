var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt'); 
var userCollection = require('../../model/userSchema')


/* GET users register form. */
router.get('/', function(req, res, next) {
  res.render('user/userRegister');
});

// posting user data to db
router.post('/',async(req,res)=>{
  try{
    if(!req.body.name || !req.body.email || !req.body.mobilenumber || !req.body.password){
      res.render('user/userRegister',{ message: 'Enter full details'});
    }else{
      const hashedPassword = await bcrypt.hash(req.body.password,10);
      const userData = {
        name : req.body.name,
        email : req.body.email,
        mobilenumber : req.body.mobilenumber,
        password : hashedPassword
      }
      console.log(userData);
      await userCollection.insertMany([userData]);
      res.render('user/userLogin');
    }
  }catch(err){
    console.log(err);
    res.render('user/userRegister',{message: "Email already registered"});
  }
})

module.exports = router;
