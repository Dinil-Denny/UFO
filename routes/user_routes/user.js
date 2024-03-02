const express = require('express');
const router = express.Router();
const{getHomePage,getUserLogin,postUserLogin,getUserRegister,postUserRegister,getForgetPasswordEmail,postForgetPasswordEmail,getOTP,postVerifyOTP,userLogout,getResendOTP,getProductListing,getProductDetails,postResendOTP} = require('../../controller/userController')

/* GET user home page. */
router.get('/',getHomePage);

// get user login form
router.get('/login',getUserLogin);

// post user login details
router.post('/login',postUserLogin);

// user logout
router.get('/logout',userLogout);

// get user registration form
router.get('/register',getUserRegister);

// post user registration details
router.post('/register',postUserRegister);

// get user login otp verification page
// router.get('/otp',getOTP);

// post otp for verification
router.post('/otp',postVerifyOTP);

// resend otp
router.get('/resendOTP',getResendOTP);

router.post('/resendOTP',postResendOTP);

// get forget password sending email
router.get('/forgetPassword',getForgetPasswordEmail);

// post forget password sending email
router.post('/forgetPassword',postForgetPasswordEmail);



// get products list
router.get('/products',getProductListing);

// product details
router.get('/productDetails/:id',getProductDetails);

module.exports = router;
