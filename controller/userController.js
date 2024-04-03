const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const userCollection = require("../model/userSchema");
const otpCollection = require("../model/otpSchema");
const productCollection = require("../model/productSchema");
const categoryCollection = require("../model/categorySchema");
const cartCollection = require("../model/cartSchema");
const sendOTPVerificationMail = require("../utils/otpVerificationMail");
const transporter = require("../utils/mailTransporter");
require("dotenv").config();

module.exports = {
  getHomePage: async (req, res, next) => {
    try {
      console.log(req.session.userid);
      const userName = req.session.username;
      console.log(userName);
      res.render("user/index", { title: "UFO", loginName: userName });
    } catch (error) {
      console.log("Error!!: ", error);
    }
  },

  getUserLogin: (req, res, next) => {
    try {
      res.render("user/userLogin", { title: "Login" });
    } catch (error) {
      console.log("Error!!: ", error);
    }
  },

  postUserLogin: async (req, res, next) => {
    const { email, password } = req.body;
    try {
      if (!email) {
        return res.render("user/userLogin", {
          message: "Email required",
          title: "Login",
        });
      }
      if (!password) {
        return res.render("user/userLogin", {
          message: "Password required",
          title: "Login",
        });
      }
      if (!email && !password) {
        return res.render("user/userLogin", {
          message: "Email and Password required",
          title: "Login",
        });
      }
      const userExist = await userCollection.findOne({ email });
      if (!userExist) {
        return res.render("user/userLogin", {
          message: "Email not registered",
          title: "Login",
        });
      } else {
        const match = await bcrypt.compare(password, userExist.password);
        if (!match) {
          return res.render("user/userLogin", {
            message: "Incorrect Password",
            title: "Login",
          });
        } else {
          req.session.userid = req.body.email;
          // Storing the user's name in the session
          req.session.username = userExist.name;
          console.log("session : ", req.session.userid);
          console.log("userExist: ", userExist.name);
          res.redirect("/");
        }
      }
    } catch (err) {
      console.log("Error!! " + err.message);
    }
  },

  userLogout: async (req, res, next) => {
    try {
      await req.sessionStore.destroy(req.session.userid,(err)=>{
        if(err) console.log("error while destroying user session: ",err)
        else res.render("user/userLogin",{title:"Login"});
      });
    } catch (error) {
      console.log("Error!!: ", error);
    }
  },

  getUserRegister: (req, res, next) => {
    try {
      res.render("user/userRegister", { title: "Register" });
    } catch (error) {
      console.log("Error!!: ", error);
    }
  },

  // user registration with otp sending to email
  postUserRegister: async (req, res) => {
    try {
      const { name, email, mobilenumber, password, confirmPassword } = req.body;

      if (!email && !mobilenumber && !password && !confirmPassword && !name) {
        return res.render("user/userRegister", {
          message: "Enter full details",
          title: "Register",
        });
      }
      if (!name) {
        return res.render("user/userRegister", {
          message: "Enter name",
          title: "Register",
        });
      }
      if (!email) {
        return res.render("user/userRegister", {
          message: "Enter email",
          title: "Register",
        });
      }
      if (!mobilenumber) {
        return res.render("user/userRegister", {
          message: "Enter mobile number",
          title: "Register",
        });
      }
      if (!password) {
        return res.render("user/userRegister", {
          message: "Enter password",
          title: "Register",
        });
      }
      if (!confirmPassword) {
        return res.render("user/userRegister", {
          message: "Confirm your password",
          title: "Register",
        });
      }
      if (password !== confirmPassword) {
        return res.render("user/userRegister", {
          message: "Both passwords should be same",
          title: "Register",
        });
      }

      // storing email in session
      req.session.useremail = req.body.email;

      // checking if the user is already registered
      const userExist = await userCollection.findOne({ email });
      if (userExist) {
        res.render("user/userRegister", {
          message: "Email already registered",
          title: "Register",
        });
      }
      // hashing password
      const hashedPassword = await bcrypt.hash(password, 10);
      // saving user in db
      // const userData = {
      // name ,
      // email ,
      // mobilenumber ,
      // password : hashedPassword,
      // createdAt : Date.now()
      // }
      // console.log(userData);
      // send otp verification email

      await sendOTPVerificationMail(email);
      // storing user credentials in session
      req.session.userName = req.body.name;
      req.session.mobileNumber = req.body.mobilenumber;
      req.session.password = hashedPassword;
      // await userCollection.insertMany([userData]);
      res.render("user/userOTPVerification", { title: "OTP verification" });
    } catch (err) {
      console.error("An error occured :" + err);
      res.render("user/userRegister", {
        message: "Something went wrong..!Please try again",
        title: "Register",
      });
    }
  },

  // getOTP : (req,res,next)=>{
  //   res.render('user/userLoginOTP',{title:"Login OTP"});
  // },

  // otp verification
  postVerifyOTP: async (req, res, next) => {
    try {
      let { otp } = req.body;
      if (!otp) {
        return res.render("user/userOTPVerification", {
          message: "OTP is required",
          title: "OTP verification",
        });
      } else {
        const otpExists = await otpCollection.findOne({ otp });
        console.log("otpExists: " + otpExists);
        if (!otpExists) {
          return res.render("user/userOTPVerification", {
            message: "Incorrect OTP",
            title: "OTP verification",
          });
        }
        const { expiresAt } = otpExists;
        console.log("expiresAt : " + expiresAt);
        // checking if otp expired or not
        let time = Date.now();
        if (expiresAt < time) {
          console.log("date now : " + time);
          await otpCollection.deleteOne({ otp: otp });
          console.log("otp deleted");
          return res.render("user/userOTPVerification", {
            message: "OTP expired! Try again",
            title: "OTP verification",
          });
        }
        if (otp === otpExists.otp) {
          // saving user in db after otp verification
          const userData = {
            name: req.session.userName,
            email: req.session.useremail,
            mobilenumber: req.session.mobileNumber,
            password: req.session.password,
            createdAt: Date.now(),
          };
          console.log(userData);
          await userCollection.insertMany([userData]);
          res.render("user/userLogin", { title: "Login" });
          console.log("user registered redirecting to login");
          await otpCollection.deleteOne({ otp: otp });
          console.log("OTP deleted");
        } else {
          return res.render("user/userOTPVerification", {
            message: "Invalid OTP! Try again",
            title: "OTP verification",
          });
        }
      }
    } catch (err) {
      console.log("An error occured: " + err.message);
    }
  },
  getResendOTP: async (req, res) => {
    const email = req.session.useremail;
    console.log("email: ", email);
    await otpCollection.deleteOne({ userId: email });
    try {
      // generate otp
      const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
      // mail options
      const oneMinute = 1 * 60 * 1000;
      const mailOptions = {
        from: process.env.AUTH_MAIL,
        to: email,
        subject: "Verify your Email",
        html: `<p>Enter ${otp} to verify your account(OTP expires in 3 mins)</p>`,
      };
      const userOTP = {
        userId: email,
        otp: otp,
        createdAt: Date.now(),
        expiresAt: Date.now() + oneMinute,
      };
      await otpCollection.insertMany([userOTP]);
      // sending email using transporter
      await transporter.sendMail(mailOptions);
      console.log("Email send");
      res.render("user/userResendOTP");
    } catch (err) {
      console.log("An error occured !!! " + err.message);
    }
  },
  postResendOTP: async (req, res, next) => {
    try {
      const { otp } = req.body;
      if (!otp) {
        return res.render("user/userResendOTP", { message: "OTP is required" });
      } else {
        const otpExists = await otpCollection.findOne({ otp });
        console.log(otpExists);
        if (!otpExists) {
          return res.render("user/userResendOTP", {
            message: "OTP not found....check once more",
          });
        }
        const { expiresAt } = otpExists;
        // checking if otp expired or not
        let time = Date.now();
        if (expiresAt < time) {
          console.log("exprire at : " + time);
          console.log("date now: " + Date.now());
          await otpCollection.deleteOne({ otp: otp });
          console.log("otp deleted");
          return res.render("user/userResendOTP", {
            message: "OTP expired! Try again",
          });
        }
        if (otp === otpExists.otp) {
          // saving user in db after otp verification
          const userData = {
            name: req.session.userName,
            email: req.session.useremail,
            mobilenumber: req.session.mobileNumber,
            password: req.session.password,
            createdAt: Date.now(),
          };
          console.log(userData);
          await userCollection.insertMany([userData]);
          await otpCollection.deleteOne({ otp: otp });
          res.render("user/userLogin");
          console.log("user registered redirecting to login page");
        } else {
          return res.render("user/userResendOTP", {
            message: "Invalid OTP! Try again",
          });
        }
      }
    } catch (err) {
      console.log("Error occured: " + err.message);
    }
  },

  getForgetPasswordEmail: (req, res, next) => {
    try {
      res.render("user/userForgetPassMail");
    } catch (error) {
      console.log("Error!!: ", error);
    }
  },

  postForgetPasswordEmail: async (req, res, next) => {
    try {
      const { email } = req.body;
      // storing email in session
      req.session.useremail = req.body.email;
      console.log(email);
      if (!email) {
        return res.render("user/userForgetPassMail", {
          title: "Forget Password",
          message: "Email id is required",
        });
      }
      const user = await userCollection.findOne({ email: email });
      console.log("User in reset pass: ", user);
      if (user) {
        await sendOTPVerificationMail(email);
        res.render("user/userForgetPassOTP", { title: "Forget Password" });
      } else {
        return res.render("user/userForgetPassMail", {
          title: "Forget Password",
          message: "Email id is not registered",
        });
      }
    } catch (err) {
      console.log("An error occured: " + err.message);
    }
  },

  postForgetPasswordOtp: async (req, res, next) => {
    try {
      const { otp } = req.body;
      if (!otp) {
        return res.render("user/userForgetPassOTP", {
          title: "Forger Password",
          message: "OTP is required",
        });
      } else {
        const otpExists = await otpCollection.findOne({ otp });
        if (!otpExists) {
          return res.render("user/userForgetPassOTP", {
            title: "Forget Password",
            message: "OTP not found....check once more",
          });
        }
        const { expiresAt } = otpExists;
        // checking if otp expired or not
        let time = Date.now();
        if (expiresAt < time) {
          await otpCollection.deleteOne({ otp: otp });
          return res.render("user/userForgetPassOTP", {
            message: "OTP expired! Try again",
            title: "Forget Password",
          });
        }
        if (otp === otpExists.otp) {
          await otpCollection.deleteOne({ otp: otp });
          return res.render("user/userResetPass", { title: "Reset Password" });
        }
      }
    } catch (error) {
      console.log("Error : ", error);
    }
  },

  getResetResendOTP: async (req, res) => {
    const email = req.session.useremail;
    await otpCollection.deleteOne({ userId: email });
    try {
      // generate otp
      const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
      // mail options
      const oneMinute = 1 * 60 * 1000;
      const mailOptions = {
        from: process.env.AUTH_MAIL,
        to: email,
        subject: "Verify your Email",
        html: `<p>Enter ${otp} to verify your account(OTP expires in 3 mins)</p>`,
      };
      const userOTP = {
        userId: email,
        otp: otp,
        createdAt: Date.now(),
        expiresAt: Date.now() + oneMinute,
      };
      await otpCollection.insertMany([userOTP]);
      // sending email using transporter
      await transporter.sendMail(mailOptions);
      res.render("user/userForgetPassOTP");
    } catch (err) {
      console.log("An error occured !!! " + err.message);
    }
  },

  resetPassword: async (req, res, next) => {
    const email = req.session.useremail;

    try {
      const { password, password1 } = req.body;
      if (!password) {
        return res.render("user/userResetPass", {
          title: "Reset Password",
          message: "Enter password",
        });
      }
      if (!password1) {
        return res.render("user/userResetPass", {
          title: "Reset Password",
          message: "Enter confirm password",
        });
      }
      if (password !== password1) {
        return res.render("user/userResetPass", {
          title: "Reset Password",
          message: "Both passwords should be same",
        });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await userCollection.findOne({ email: email });
      await userCollection.findByIdAndUpdate(user._id, {
        password: hashedPassword,
      });
      
      res.redirect("/login");
    } catch (error) {
      console.log("Error: ", error);
    }
  },

  getProductListing: async (req, res, next) => {
    try {
      const products = await productCollection.find().lean();
      res.render("user/productList", {
        title: "Products",
        products,
        loginName: req.session.username,
      });
    } catch (error) {
      console.log("Error!! : ", error);
    }
  },

  getProductDetails: async (req, res) => {
    try {
      // converting this string id into object id
      const objectId = new mongoose.Types.ObjectId(req.params.id);
      const product = await productCollection.findById(objectId).lean();
      const user = await userCollection.findOne({email:req.session.userid});
      const userId = user._id;
      const cart = await cartCollection.findOne({userId});
      console.log("cart : ",cart);

      if(cart){
        const existingProduct = cart.products.find(product => product.productId.toString() === objectId.toString());
        
        if(existingProduct){
          const quantity = existingProduct.quantity;
          // checking if product is in stock
          let isInStock = product.stock > quantity
          return res.render("user/productDetails", {
            title: "Product Details",
            product,
            loginName: req.session.username,
            isInStock
          });
        }
      }
      let isInStock = product.stock > 0
      res.render("user/productDetails", {
        title: "Product Details",
        product,
        loginName: req.session.username,
        isInStock
      });
      // const existingProduct = cart.products.find(product => product.productId.toString() === objectId.toString());
      // console.log("existingProduct: ",existingProduct);
      // const quantity = existingProduct.quantity;
      // console.log("quantity: ",quantity);
      
    } catch (error) {
      console.log("Error!!: ", error);
    }
  },

  // product filtering
   filterProducts: async (req, res, next) => {
    const filters = req.query;
    console.log("filters: ",filters);
    let query = {};


    // filter based on gender
    if(Array.isArray(filters.gender)){
      query.gender = {$in : filters.gender};
    }else if(filters.gender){
      query.gender = filters.gender;
    }

    // filter based on brand name
    if(Array.isArray(filters.brand)){
      query.brandName = {$in : filters.brand};
    }else if(filters.brand){
      query.brandName = filters.brand;
    }
      
    // filter on price
    if(Array.isArray(filters.offerPrice)){
      const parsedPriceFilter = filters.offerPrice.map(value => parseInt(value));
      query.offerPrice = {$gte: Math.min(...parsedPriceFilter),$lte:Math.max(...parsedPriceFilter)+500}
    }else if(filters.offerPrice){
      if(filters.offerPrice === '3000') 
      query.offerPrice = {$gte:Number(filters.offerPrice)}
      else
      query.offerPrice = {$gte:Number(filters.offerPrice),$lte:Number(filters.offerPrice)+500}
    }

    console.log("query: ",query);
    try {
      if(filters.sort){
        const filteredProducs = await productCollection.find(query).populate('category').sort({offerPrice:Number(filters.sort)}).lean();
        res.send(filteredProducs);
      }else{
        const filteredProducs = await productCollection.find(query).populate('category').lean();
        res.send(filteredProducs);
      }
      
      // console.log("Filtered products: ",filteredProducs);
      
    } catch (error) {
      console.log("Error occured while sorting: ", error.message);
    }
  },
};
