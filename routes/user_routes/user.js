const express = require('express');
const router = express.Router();
const{getHomePage,getUserLogin,postUserLogin,getUserRegister,postUserRegister,getForgetPasswordEmail,postForgetPasswordEmail,postVerifyOTP,userLogout,getResendOTP,getProductListing,getProductDetails,postResendOTP,postForgetPasswordOtp,getResetResendOTP,resetPassword,filterProducts} = require('../../controller/userController')

const{getAddnewAddress,postAddnewAddress,getAccountOverview,getEditAddress,postEditAddress,getEditDetails,postEditDetails,deleteAddress} = require('../../controller/userAddressController');

const{getCart,addToCart,removeItemInCart,updateCartQuantity} = require('../../controller/cartControllers');

const {userAuthentication,preventUserBackToLogin} = require('../../middlewares/userAuthMiddleware');

/* GET user home page. */
router.get('/',getHomePage);

// get user login form
router.get('/login',preventUserBackToLogin,getUserLogin);

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
router.post('/addAddress',userAuthentication,postAddnewAddress)

// get edit address
router.get('/editAddress/:id',userAuthentication,getEditAddress);
router.post('/editAddress/:id',postEditAddress);

// soft delete address
router.get('/deleteAddress/:id',userAuthentication,deleteAddress);

// get edit details
router.get('/editDetails/:id',userAuthentication,getEditDetails);
router.post('/editDetails/:id',userAuthentication,postEditDetails);

// filter products
router.get('/filter',filterProducts);

// get cart
router.get('/cart',userAuthentication,getCart);

// add to cart
router.post('/addToCart/:id',userAuthentication,addToCart);

//updating cart quantity
router.post('/updateCartQuantity',userAuthentication,updateCartQuantity);

// delete product from cart 
router.get('/removeCartItem/:id',userAuthentication,removeItemInCart)
module.exports = router;
