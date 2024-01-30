var express = require('express');
var router = express.Router();

// get user login form
router.get('/',(req,res,next)=>{
    res.render('user/userLogin');
})


// get user login otp verification page
router.get('/user_otp',(req,res,next)=>{
    res.render('user/userLoginOTP');
})


// get user forget password page
router.get('/user_forgetPassword',(req,res,next)=>{
    res.render('user/userForgetPass');
})


// get uer reset password page
router.get('/user_resetPassword',(req,res,next)=>{
    res.render('user/userResetPass');
})

module.exports = router;