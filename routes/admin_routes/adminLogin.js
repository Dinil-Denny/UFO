var express = require('express');
var router = express.Router()

router.get('/',(req,res,next)=>{
    res.render('admin/adminLogin',{admin:true});
})

module.exports = router;