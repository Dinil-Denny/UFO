const express = require('express');
const router = express.Router();
const {getDashboard,getUserList,getAdminLogin,postAdminLogin,getAdminRegister,postAdminRegister,adminLogout, blockUser} = require('../../controller/adminControllers');

// get admin dashboard
router.get('/', getDashboard);

// get admin registration
router.get('/register',getAdminRegister);

// post admin registration details
router.post('/register',postAdminRegister);

// get admin login page
router.get('/login',getAdminLogin);

//admin login validation
router.post('/login',postAdminLogin);

// admin logout
router.get('/logout',adminLogout);

// get customer's details
router.get('/customers',getUserList);

// block user
router.get('/block/:id',blockUser);


router.get('/banner',async(req,res,next)=>{
    res.render('admin/adminBanner',{admin:true});
})


module.exports = router;