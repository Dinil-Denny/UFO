const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const userCollection = require('../model/userSchema');
const otpCollection = require('../model/otpSchema');
// const transporter = require('../utils/mailTransporter');
const sendOTPVerificationMail = require('../utils/otpVerificationMail');
const transporter = require('../utils/mailTransporter');
require('dotenv').config();

module.exports = {
    getHomePage : (req, res, next)=>{
        res.render('user/index', {title:"UFO"});
    },

    getUserLogin : (req,res,next)=>{
        res.render('user/userLogin',{title:"Login"});
    },

    postUserLogin : async(req,res,next)=>{
      const{email,password} = req.body;
      try{
        if(!email){
          res.render('user/userLogin',{message:"Email required",title:"Login"});
        }else if(!password){
          res.render('user/userLogin',{message:"Password required",title:"Login"});
        }else if(!email && !password){
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
            res.render('user/index',{loginName : userExist.name,title:"UFO"});
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
          if(!name){
            res.render('user/userRegister',{ message: 'Enter name',title:"Register"});
          }else if(!email){
            res.render('user/userRegister',{ message: 'Enter email',title:"Register"});
          }else if(!mobilenumber){
            res.render('user/userRegister',{ message: 'Enter mobile number',title:"Register"});
          }else if(!password){
            res.render('user/userRegister',{ message: 'Enter password',title:"Register"});
          }else if(!confirmPassword){
            res.render('user/userRegister',{ message: 'Confirm your password',title:"Register"});
          }else if(password !== confirmPassword){
            res.render('user/userRegister',{message : "Both passwords should be same",title:"Register"});
          }
          else{
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
                await userCollection.insertMany([userData]);
                // send otp verification email
                await sendOTPVerificationMail(email);
                res.render('user/userOTPVerification',{title:"OTP verification"});
                
            }
        }catch(err){
          console.error("An error occured :"+err);
          res.render('user/userRegister',{message: "Something went wrong..!Please try again",title:"Register"});
        }
    },

    getOTP : (req,res,next)=>{
      res.render('user/userLoginOTP',{title:"Login OTP"});
    },
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
            res.render('user/userOTPVerification',{message:"OTP not found....check once more",title:"OTP verification"});
          }
          const expiresAt = otpExists.expiresAt;
          console.log("expiresAt : "+expiresAt)
          // checking if otp expired or not
          if(expiresAt<Date.now()){
            console.log(Date.now());
            await otpCollection.deleteOne({otp:otp});
            console.log("otp deleted");
            res.render('user/userOTPVerification',{message:"OTP expired! Try again",title:"OTP verification"});
          }
          if(otp === otpExists.otp){
            res.render('user/userLogin',{title:"Login"});
          }else{
            res.render('user/userOTPVerification',{message:"Invalid OTP! Try again",title:"OTP verification"});
          }
        }
      }catch(err){
        console.log("An error occured: "+err.message);
      }

    },
    getResendOTP : async(req,res)=>{
      const recentUser = await userCollection.find({}).sort({createdAt:-1}).limit(1);
      console.log(recentUser[0].email);
      try{
        // generate otp
        const otp = `${(Math.floor(1000+Math.random()*9000))}`;
        // mail options
        const mailOptions = {
          from: process.env.AUTH_MAIL,
          to : recentUser[0].email,
          subject : "Verify your Email",
          html : `<p>Enter ${otp} to verify your account(OTP expires in 3 mins)</p>`
        }
        const userOTP = {
          userId : recentUser[0].email,
          otp : otp,
          createdAt : Date.now(),
          expiresAt : Date.now()+3000
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
          if(expiresAt<Date.now()){
            await otpCollection.deleteOne({otp:otp});
            res.render('user/userResendOTP',{message:"OTP expired! Try again"});
          }
          if(otp === otpExists.otp){
            res.render('user/userLogin');
          }else{
            res.render('user/userResendOTP',{message:"Invalid OTP! Try again"});
          }
        }
      }catch(err){
        console.log("Error occured: "+err.message);
      }
    },

    getForgetPassword : (req,res,next)=>{
          res.render('user/userForgetPass');
    },
    
    getProductListing : (req,res,next)=>{
      res.render('user/productList',{title:"Products"});
    },

    getProductDetails : (req,res)=>{
      res.render('user/productDetails',{title:"Product Details"});
    },


}