const express = require('express');
const router = express.Router();
const{getHomePage,getUserLogin,postUserLogin,getUserRegister,postUserRegister,getForgetPasswordEmail,postForgetPasswordEmail,postVerifyOTP,userLogout,getResendOTP,postResendOTP,postForgetPasswordOtp,getResetResendOTP,resetPassword} = require('../../controller/userControllers/userController');
const{getProductListing,getProductDetails,filterProducts,productListingPagination} = require('../../controller/userControllers/productsManagementControllers');
const{getAddnewAddress,postAddnewAddress,getAccountOverview,getOrderDetails,getEditAddress,postEditAddress,getEditDetails,postEditDetails,getEditEmail,getEditEmailOTP,verigyEditEmail,getChangePassword,postChangePassword,deleteAddress,cancelProduct,returnProduct} = require('../../controller/userControllers/userAccountOverviewControllers');
const{getCart,addToCart,removeItemInCart,updateCartQuantity,getWishlist,wishlistControl} = require('../../controller/userControllers/cartControllers');
const{getCartCheckout,postCartCheckout,retryPayment,verifyRazorpayPayment,getOrderSuccessPage,getOrderFailurePage} = require('../../controller/userControllers/orderController');
const{getCoupons,couponCodeValidation} = require('../../controller/userControllers/couponControllers');
const{getWallet} = require('../../controller/userControllers/walletController');
//middlewares
const {userAuthentication,preventUserBackToLogin} = require('../../middlewares/userAuthMiddleware');
const{pagination} = require('../../middlewares/pagination');
const {filterSorting} = require('../../middlewares/filteringSortingMiddleware');

/* GET user home page. */
router.get('/',userAuthentication,getHomePage);
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
router.get('/products',userAuthentication,pagination,getProductListing);
router.get('/pagination',pagination,productListingPagination);

// filter products
router.get('/filter',filterSorting,filterProducts);

//search products
// router.get('/search',userAuthentication,searchProducts);

// product details
router.get('/productDetails/:id',userAuthentication,getProductDetails);

// account overview - order history
router.get('/account_overview',userAuthentication,getAccountOverview);
//order details 
router.get('/orderDetails/:id',userAuthentication,getOrderDetails);
//cancel ordered product
router.get('/cancelProduct/:orderId/:productObjId/:productId',userAuthentication,cancelProduct);
//return product 
router.get('/returnProduct/:orderId/:productObjId/:productId',userAuthentication,returnProduct);

// get add address
router.get('/addAddress',userAuthentication,getAddnewAddress);
router.post('/addAddress',userAuthentication,postAddnewAddress)

// get edit address
router.get('/editAddress/:id',userAuthentication,getEditAddress);
router.post('/editAddress/:id',userAuthentication,postEditAddress);

// soft delete address
router.get('/deleteAddress/:id',userAuthentication,deleteAddress);

// get edit details
router.get('/editDetails/:id',userAuthentication,getEditDetails);
router.post('/editDetails/:id',userAuthentication,postEditDetails);
//get edit email
router.get('/editEmail/:id',userAuthentication,getEditEmail);
router.get('/emailEditOtp',userAuthentication,getEditEmailOTP);
router.post('/verifyEmailEditOTP',userAuthentication,verigyEditEmail);

//change password
router.get('/changePassword/:id',userAuthentication,getChangePassword);
router.post('/changePassword/:id',userAuthentication,postChangePassword);

// get cart
router.get('/cart',userAuthentication,getCart);
// add to cart
router.post('/addToCart/:id',userAuthentication,addToCart);
//updating cart quantity
router.post('/updateCartQuantity',userAuthentication,updateCartQuantity);
// delete product from cart 
router.get('/removeCartItem/:id',userAuthentication,removeItemInCart)
// cart checkout page
router.get('/checkout',userAuthentication,getCartCheckout);
router.post('/checkout',userAuthentication,postCartCheckout);

//get wishlist
router.get('/getWishlist',userAuthentication,getWishlist);
//add to whishlist
router.post('/wishlist/:id',userAuthentication,wishlistControl);

//coupons page
router.get('/coupons',userAuthentication,getCoupons);
router.post('/couponValidation',userAuthentication,couponCodeValidation);

//retry failde payment
router.post('/retryPayment',userAuthentication,retryPayment);
//verify payment
router.post('/verifyPayment',verifyRazorpayPayment);

//order success
router.get('/orderSuccess',userAuthentication,getOrderSuccessPage);
//order failure
router.get('/orderFailed',userAuthentication,getOrderFailurePage)

//wallet 
router.get('/wallet',userAuthentication,getWallet);

module.exports = router;
