const express = require('express');
const router = express.Router();
const {getAdminLogin,postAdminLogin,adminLogout,} = require('../../controller/adminControllers/adminControllers');
const {getUserList,blockUser} = require('../../controller/adminControllers/adminUserController');
const {getDashboard,topSellingProducts,topSellingCategorys,topSellingBrands,getPeriodicChartData,getDailySalesData,getDaywiseSalesData} = require('../../controller/adminControllers/dashBoardControllers');
const {getAddCatagory,postAddCatagory,deleteCategory,getEditCategory,postEditCategory} = require('../../controller/adminControllers/adminCategoryController');
const {productList,productListPagination,getAddProduct,postAddProducts,postAddBrand,blockProducts,getEditPorducts,postEditProducts,deleteProducts} = require('../../controller/adminControllers/adminProductsController');
const {getOrders,getOrderDetails,updateOrderStatus} = require('../../controller/adminControllers/adminOrderController');
const {getCouponList,getAddCoupon,postAddCoupon,couponStatusUpdate,getEditCoupon,postEditCoupon,deleteCoupon} = require('../../controller/adminControllers/couponController');
const {getSalesData,getCustomDateSalesData,getDayWiseData,getPeriodicSalesData} = require('../../controller/adminControllers/salesReportControllers');
const {getOfferList,getAddOffer,postAddOffer,getEditOffer,postEditOffer,deleteOffer,offerStatusUpdate} = require('../../controller/adminControllers/offerControllers');

const { upload } = require('../../config/multerStorage');
const {adminAuthentication} = require('../../middlewares/adminAuthMiddleware');
const {pagination} = require('../../middlewares/pagination');

// get admin dashboard
router.get('/',adminAuthentication, getDashboard);
router.get('/topSellingProducts',adminAuthentication,topSellingProducts);
router.get('/topSellingCategorys',adminAuthentication,topSellingCategorys);
router.get('/topSellingBrands',adminAuthentication,topSellingBrands);
router.get('/chartFilter',adminAuthentication,getPeriodicChartData);
router.get('/dailySalesData',adminAuthentication,getDailySalesData);
router.get('/dayWiseData',adminAuthentication,getDaywiseSalesData);

// get admin login page
router.get('/login',getAdminLogin);

//admin login validation
router.post('/login',postAdminLogin);

// admin logout
router.get('/logout',adminLogout);

// get customer's details
router.get('/customers',adminAuthentication,getUserList);

// block user
router.get('/block/:id',adminAuthentication,blockUser);

// adding a catagory
router.get('/category',adminAuthentication,getAddCatagory);
router.post('/category',adminAuthentication,postAddCatagory);

// deleting a category
router.get('/deleteCategory/:id',adminAuthentication,deleteCategory);

// editing a category
router.get('/editCategory/:id',adminAuthentication,getEditCategory);
router.post('/editCategory/:id',adminAuthentication,postEditCategory);

// getting products
router.get('/products',adminAuthentication,pagination,productList);
//products list table pagination
router.get('/productListPagination',adminAuthentication,pagination,productListPagination);

// get the add new product form
router.get('/addProduct',adminAuthentication,getAddProduct);
router.post('/addProduct',upload.array('images',5),adminAuthentication,postAddProducts);

//adding brand
router.post('/addBrand',adminAuthentication,postAddBrand);

// unlist or list the products(soft delete)
router.get('/active/:id',adminAuthentication,blockProducts);
// get edit product page
router.get('/editProduct/:id',adminAuthentication,getEditPorducts);
//post edit products
router.post('/editProduct/:id',upload.array('images',5),postEditProducts);
//delete products
router.get('/deleteProduct/:id',adminAuthentication,deleteProducts);

//admin order controller
router.get('/orders',adminAuthentication,getOrders);    
//admin order details
router.get('/orderDetails/:id',adminAuthentication,getOrderDetails);
//updating order status
router.post('/updateOrderStatus',adminAuthentication,updateOrderStatus);

// get all coupons
router.get('/coupons',adminAuthentication,getCouponList);
//get add coupon
router.get('/addCoupon',adminAuthentication,getAddCoupon);
//post add coupon
router.post('/addCoupon',adminAuthentication,postAddCoupon);
router.post('/updateCouponStatus',adminAuthentication,couponStatusUpdate);
router.get('/editCoupon/:id',adminAuthentication,getEditCoupon);
router.post('/editCoupon/:id',adminAuthentication,postEditCoupon);
router.get('/deleteCoupon/:id',adminAuthentication,deleteCoupon);

//sales report
router.get('/salesReport',adminAuthentication,getSalesData);
router.get('/customDateSalesData',adminAuthentication,getCustomDateSalesData);
router.get('/singleDaySalesReport',adminAuthentication,getDayWiseData);
router.get('/periodicSalesData',adminAuthentication,getPeriodicSalesData);

//offer module - category offers
router.get('/offers',adminAuthentication,getOfferList);
router.get('/addOffer',adminAuthentication,getAddOffer);
router.post('/addOffer',adminAuthentication,postAddOffer);
router.get('/editOffer/:id',adminAuthentication,getEditOffer);
router.post('/editOffer/:id',adminAuthentication,postEditOffer);
router.get('/deleteOffer/:id',adminAuthentication,deleteOffer);
router.post('/updateStatus',adminAuthentication,offerStatusUpdate);


module.exports = router;