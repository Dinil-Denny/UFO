const express = require('express');
const router = express.Router();
const {getDashboard,getUserList,getAdminLogin,postAdminLogin,adminLogout, blockUser,getAddCatagory,postAddCatagory,deleteCategory,productList,productListPagination,getEditCategory,postEditCategory,getAddProduct,postAddProducts,postAddBrand,blockProducts,getEditPorducts,postEditProducts,deleteProducts} = require('../../controller/adminControllers');

const{getOrders,getOrderDetails,updateOrderStatus} = require('../../controller/adminOrderController');

const { upload } = require('../../config/multerStorage');
const {adminAuthentication} = require('../../middlewares/adminAuthMiddleware');
const {pagination} = require('../../middlewares/pagination');

// get admin dashboard
router.get('/',adminAuthentication, getDashboard);

// get admin registration
// router.get('/register',getAdminRegister);

// post admin registration details
// router.post('/register',postAdminRegister);

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

router.get('/pagination',adminAuthentication,pagination,productListPagination);

// get the add new product form
router.get('/addProduct',adminAuthentication,getAddProduct);
router.post('/addProduct',upload.array('images',5),adminAuthentication,postAddProducts);

//adding brand
router.post('/addBrand',adminAuthentication,postAddBrand);

// unlist or list the products(soft delete)
router.get('/active/:id',adminAuthentication,blockProducts);
// get edit product page
router.get('/editProduct/:id',adminAuthentication,getEditPorducts);
router.post('/editProduct/:id',upload.array('images',5),postEditProducts);

router.get('/deleteProduct/:id',adminAuthentication,deleteProducts);

//admin order controller
router.get('/orders',adminAuthentication,getOrders);

//admin order details
router.get('/orderDetails/:id',adminAuthentication,getOrderDetails);

router.post('/updateOrderStatus',adminAuthentication,updateOrderStatus);


// router.get('/banner',async(req,res,next)=>{
//     res.render('admin/adminBanner',{admin:true});
// })


module.exports = router;