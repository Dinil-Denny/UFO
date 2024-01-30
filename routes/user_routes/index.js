var express = require('express');
var router = express.Router();

/* GET user home page. */
router.get('/', function(req, res, next) {
  res.render('user/index', { admin: false, user:true, message:"User-1"});
});

module.exports = router;
