const express = require('express');
const router = express.Router();
const{getHomePage,getUserLogin,postUserLogin,getUserRegister,postUserRegister,getForgetPasswordEmail,postForgetPasswordEmail,postVerifyOTP,userLogout,getResendOTP,getProductListing,getProductDetails,postResendOTP,postForgetPasswordOtp,getResetResendOTP,resetPassword} = require('../../controller/userController')

const{getAddnewAddress,postAddnewAddress,getAccountOverview,getEditAddress,postEditAddress,getEditDetails,postEditDetails,deleteAddress} = require('../../controller/userAddressController');
const {userAuthentication,preventBackToLogin} = require('../../middlewares/userAuthMiddleware');

/* GET user home page. */
router.get('/',getHomePage);

// get user login form
router.get('/login',preventBackToLogin,getUserLogin);

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

router.post('/resetPassword',postForgetPasswordOtp);

router.get('/resend-resetOTP',getResetResendOTP);

router.post('/resetAccountPassword',resetPassword);

// get products list
router.get('/products',userAuthentication,getProductListing);

// product details
router.get('/productDetails/:id',userAuthentication,getProductDetails);

// account overview
router.get('/account_overview',userAuthentication,getAccountOverview);

// get add address
router.get('/addAddress',userAuthentication,getAddnewAddress);
router.post('/addAddress',postAddnewAddress)

// get edit address
router.get('/editAddress/:id',getEditAddress);
router.post('/editAddress/:id',postEditAddress);

// soft delete address
router.get('/deleteAddress/:id',deleteAddress);

// get edit details
router.get('/editDetails/:id',getEditDetails);
router.post('/editDetails/:id',postEditDetails);

module.exports = router;
