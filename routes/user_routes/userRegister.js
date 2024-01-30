var express = require('express');
var router = express.Router();

/* GET users register form. */
router.get('/', function(req, res, next) {
  res.render('user/userRegister');
});



module.exports = router;
