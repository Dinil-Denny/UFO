const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const userCollection = require('../model/userSchema');
const otpCollection = require('../model/otpSchema');
const productCollection = require('../model/productSchema');
// const transporter = require('../utils/mailTransporter');
const sendOTPVerificationMail = require('../utils/otpVerificationMail');
const transporter = require('../utils/mailTransporter');
require('dotenv').config();

module.exports = {
    getHomePage : (req, res, next)=>{
      const userName = req.session.username;
      console.log(userName);
      res.render('user/index', {title:"UFO",loginName : userName});
    },

    getUserLogin : (req,res,next)=>{
        res.render('user/userLogin',{title:"Login"});
    },

    postUserLogin : async(req,res,next)=>{
      const{email,password} = req.body;
      try{
        if(!email){
          res.render('user/userLogin',{message:"Email required",title:"Login"});
        }if(!password){
          res.render('user/userLogin',{message:"Password required",title:"Login"});
        }if(!email && !password){
          res.render('user/userLogin',{message:"Email and Password required",title:"Login"});
        }
        const userExist = await userCollection.findOne({email});
        if(!userExist){
          res.render('user/userLogin',{message:"Email not registered",title:"Login"});
        }else{
          const match = await bcrypt.compare(password,userExist.password);
          if(!match){
            res.render('user/userLogin',{message:"Incorrect Password",title:"Login"});
          }else{
            req.session.userid = req.body.email; 
            // Storing the user's name in the session
            req.session.username = userExist.name;
            console.log("session : ",req.session.username);
            console.log("userExist: ",userExist.name);
            res.redirect('/');
          }
        } 

      }catch(err){
        console.log("Error!! "+err.message);
      }
    },

    userLogout : async(req,res,next)=>{
      await req.session.destroy();
      res.render('user/userLogin',{title:"Login"}); 
    },

    getUserRegister : (req, res, next)=>{
        res.render('user/userRegister',{title:"Register"});
    },

    // user registration with otp sending to email
    postUserRegister : async(req,res)=>{
        try{
          const{name,email,mobilenumber,password,confirmPassword} = req.body;
          req.session.useremail = req.body.email;
          if(!email && !mobilenumber && !password && !confirmPassword && !name){
            res.render('user/userRegister',{message : "Enter full details",title:"Register"});
          }if(!name){
            res.render('user/userRegister',{ message: 'Enter name',title:"Register"});
          }if(!email){
            res.render('user/userRegister',{ message: 'Enter email',title:"Register"});
          }if(!mobilenumber){
            res.render('user/userRegister',{ message: 'Enter mobile number',title:"Register"});
          }if(!password){
            res.render('user/userRegister',{ message: 'Enter password',title:"Register"});
          }if(!confirmPassword){
            res.render('user/userRegister',{ message: 'Confirm your password',title:"Register"});
          }if(password !== confirmPassword){
            res.render('user/userRegister',{message : "Both passwords should be same",title:"Register"});
          }
            // checking if the user is already registered
            const userExist = await userCollection.findOne({email});
            if(userExist){
                res.render('user/userRegister',{ message: 'Email already registered',title:"Register"});
            }
            // hashing password
                const hashedPassword = await bcrypt.hash(password,10);
            // saving user in db
                const userData = {
                name ,
                email ,
                mobilenumber ,
                password : hashedPassword,
                createdAt : Date.now()
                }
                console.log(userData);
                // send otp verification email
                await sendOTPVerificationMail(email);
                await userCollection.insertMany([userData]);
                res.render('user/userOTPVerification',{title:"OTP verification"});
        }catch(err){
          console.error("An error occured :"+err);
          res.render('user/userRegister',{message: "Something went wrong..!Please try again",title:"Register"});
        }
    },

    // getOTP : (req,res,next)=>{
    //   res.render('user/userLoginOTP',{title:"Login OTP"});
    // },

    // otp verification
    postVerifyOTP : async(req,res,next)=>{
      try{
        let {otp} = req.body;
        if(!otp) {
          res.render('user/userOTPVerification',{ message:"OTP is required",title:"OTP verification"});
        }else{
          const otpExists = await otpCollection.findOne({otp});
          console.log("otpExists: "+otpExists);
          if(!otpExists){
            res.render('user/userOTPVerification',{message:"Incorrect OTP",title:"OTP verification"});
          }
          const {expiresAt} = otpExists;
          console.log("expiresAt : "+expiresAt)
          // checking if otp expired or not
          let time = Date.now();
          if(expiresAt<time){
            console.log("date now : "+time);
            await otpCollection.deleteOne({otp:otp});
            console.log("otp deleted");
            res.render('user/userOTPVerification',{message:"OTP expired! Try again",title:"OTP verification"});
          }
          if(otp === otpExists.otp){
            res.render('user/userLogin',{title:"Login"});
            console.log("user registered redirecting to login");
            await otpCollection.deleteOne({otp:otp});
            console.log("OTP deleted");
          }else{
            res.render('user/userOTPVerification',{message:"Invalid OTP! Try again",title:"OTP verification"});
          }
        }
      }catch(err){
        console.log("An error occured: "+err.message);
      }

    },
    getResendOTP : async(req,res)=>{
      // const recentUser = await userCollection.find({}).sort({createdAt:-1}).limit(1);
      // console.log(recentUser[0].email);
      const email = req.session.useremail;
      console.log("email: ",email);
      try{
        // generate otp
        const otp = `${(Math.floor(1000+Math.random()*9000))}`;
        // mail options
        const oneMinute = 1*60*1000;
        const mailOptions = {
          from: process.env.AUTH_MAIL,
          to : email,
          subject : "Verify your Email",
          html : `<p>Enter ${otp} to verify your account(OTP expires in 3 mins)</p>`
        }
        const userOTP = {
          userId : email,
          otp : otp,
          createdAt : Date.now(),
          expiresAt : Date.now() + oneMinute
        }
        await otpCollection.insertMany([userOTP]); 
        // sending email using transporter
        await transporter.sendMail(mailOptions);
        console.log("Email send");
        res.render('user/userResendOTP');
      }catch(err){
        console.log("An error occured !!! "+err.message);
      }
    },
    postResendOTP : async(req,res,next)=>{
      try{
        const {otp} = req.body;
        if(!otp) {
          res.render('user/userResendOTP',{ message:"OTP is required"});
        }else{
          const otpExists = await otpCollection.findOne({otp});
          console.log(otpExists);
          if(!otpExists){
            res.render('user/userResendOTP',{message:"OTP not found....check once more"});
          }
          const {expiresAt} = otpExists;
          // checking if otp expired or not
          let time = Date.now();
          if(expiresAt<time){
            console.log("exprire at : "+time);
            console.log("date now: "+Date.now());
            await otpCollection.deleteOne({otp:otp});
            res.render('user/userResendOTP',{message:"OTP expired! Try again"});
          }
          if(otp === otpExists.otp){
            res.render('user/userLogin');
            console.log("user registered redirecting to login page")
            otpCollection.deleteOne({otp:otp});
          }else{
            res.render('user/userResendOTP',{message:"Invalid OTP! Try again"});
          }
        }
      }catch(err){
        console.log("Error occured: "+err.message);
      }
    },

    getForgetPasswordEmail : (req,res,next)=>{
          res.render('user/userForgetPassMail');
    },
    postForgetPasswordEmail: async(req,res,next)=>{
      try{
        const {email} = req.body;
        console.log(email);
        if(!email){
          res.render('user/userForgetPassMail',{title:'Forget Password',message:"Email id is required"});
        }
        await sendOTPVerificationMail(email);
        res.render('user/userResetPass',{title:'Forget Password'});
      }catch(err){
        console.log("An error occured: "+err.message);
      }
    },
    
    getProductListing : async(req,res,next)=>{
      try {
        const products = await productCollection.find().lean();
        console.log("Products in product list: ",products);
        res.render('user/productList',{title:"Products",products});
      } catch (error) {
        console.log("Error!! : ",error);
      }
      
    },

    getProductDetails : (req,res)=>{
      res.render('user/productDetails',{title:"Product Details"});
    },


}