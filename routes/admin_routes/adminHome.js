var express = require('express');
var router = express.Router()

router.get('/',(req,res,next)=>{
    res.render('admin/adminDashboard',{admin:true, message:"Admin"});
})


router.get('/dashboard',(req,res,next)=>{
    res.render('admin/adminDashboard',{admin:true, message:"Admin"});
})


router.get('/customers',(req,res,next)=>{
    res.render('admin/adminCustomers',{admin:true,message:"Admin"});
})


router.get('/banner',(req,res,next)=>{
    res.render('admin/adminBanner',{admin:true,message:"Admin"});
})
module.exports = router;