const express = require('express');
const router = express.Router();
const {getDashboard,getUserList,getAdminLogin,postAdminLogin,adminLogout, blockUser,getAddCatagory,postAddCatagory,deleteCategory,productList,getEditCategory,postEditCategory,getAddProduct,postAddProducts,blockProducts,getEditPorducts,postEditProducts,deleteProducts} = require('../../controller/adminControllers');
const { upload } = require('../../config/multerStorage');
const {adminAuthentication} = require('../../middlewares/adminAuthMiddleware');

// get admin dashboard
router.get('/', getDashboard);

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
router.get('/products',adminAuthentication,productList);

// get the add new product form
router.get('/addProduct',adminAuthentication,getAddProduct);
router.post('/addProduct',upload.array('images',5),postAddProducts);

// unlist or list the products(soft delete)
router.get('/active/:id',adminAuthentication,blockProducts);
// get edit product page
router.get('/editProduct/:id',adminAuthentication,getEditPorducts);
router.post('/editProduct/:id',upload.array('images',5),postEditProducts);

router.get('/deleteProduct/:id',adminAuthentication,deleteProducts);






// router.get('/banner',async(req,res,next)=>{
//     res.render('admin/adminBanner',{admin:true});
// })


module.exports = router;