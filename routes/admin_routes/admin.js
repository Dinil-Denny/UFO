const express = require('express');
const router = express.Router();
const {getDashboard,getUserList,getAdminLogin,postAdminLogin,getAdminRegister,postAdminRegister,adminLogout} = require('../../controller/adminControllers');

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
router.post('/logout',adminLogout);

// get customer's details
router.get('/customers',getUserList);




router.get('/banner',async(req,res,next)=>{
    res.render('admin/adminBanner',{admin:true});
})




router.get('/logout',async(req,res,next)=>{
    req.session.destroy();
    res.render('admin/adminLogin',{admin:true});
})

module.exports = router;