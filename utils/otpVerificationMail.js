const bcrypt = require('bcrypt');
const otpCollection = require('../model/otpSchema');
const transporter = require('../utils/mailTransporter');
require('dotenv').config();

const sendOTPVerificationMail = async(email)=>{
    try{
      // generate otp
      const otp = `${(Math.floor(1000+Math.random()*9000))}`;
      // mail options
      const oneMinute = 1*60*1000; 
      const mailOptions = {
        from: process.env.AUTH_MAIL,
        to : email,
        subject : "Verify your Email",
        html : `<p>Enter ${otp} to verify your account(OTP expires in 1 mins)</p>`
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
    }catch(err){
      console.log("An error occured !!! "+err.message);
    }
  }

  module.exports = sendOTPVerificationMail;