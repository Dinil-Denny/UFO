const bcrypt = require("bcrypt");
const userCollection = require("../../model/userSchema");
const otpCollection = require("../../model/otpSchema");
const sendOTPVerificationMail = require("../../utils/otpVerificationMail");
const transporter = require("../../utils/mailTransporter");
const {generateReferralCode} = require('../../helpers/referralCodeGeneration');
const referralCodeCollection = require('../../model/referralCodeSchema');
const walletCollection = require('../../model/walletSchema');
const orderCollection = require('../../model/orderSchema');
require("dotenv").config();

module.exports = {
  getHomePage: async (req, res, next) => {
    try {
      const userName = req.session.username;
      const topSellingProducts = await orderCollection.aggregate([
          {
              $unwind:"$productsData"
          },
          {
              $group:{_id:'$productsData.productId',quantityOrdered:{$sum:'$productsData.quantity'}}
          },
          {
              $sort:{quantityOrdered:-1}
          },
          {
              $lookup:{
                  from:"products",
                  localField:"_id",
                  foreignField:"_id",
                  as:"orderedProducts"
              }
          },
          {
            $project:{orderedProducts:1,_id:0}
          },
          {
            $unwind:"$orderedProducts"
          },
          {
              $limit:4
          }
      ]);
      res.render("user/index", { title: "UFO", loginName: userName ,topSellingProducts:topSellingProducts});
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
        if(err) throw err;
        else res.render("user/userLogin",{title:"Login"});
      });
    } catch (err) {
      console.log("Error!!: ", err.message);
    }
  },

  getUserRegister: (req, res, next) => {
    try {
      if(req.query){
        const referralCode = req.query.referralCode;
        res.render("user/userRegister", { title: "Register",referralCode});
      }else{
        res.render("user/userRegister", { title: "Register"});
      }
    } catch (error) {
      console.log("Error!!: ", error);
    }
  },

  // user registration with otp sending to email
  postUserRegister: async (req, res) => {
    try {
      const { name, email, mobilenumber, password, confirmPassword, referralCode } = req.body;
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

      await sendOTPVerificationMail(email);
      // storing user credentials in session
      req.session.userName = req.body.name;
      req.session.mobileNumber = req.body.mobilenumber;
      req.session.password = hashedPassword;
      if(referralCode){
        req.session.referralCode = referralCode;
      }else{
        req.session.referralCode = null;
      }
      
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
        if (!otpExists) {
          return res.render("user/userOTPVerification", {
            message: "Incorrect OTP",
            title: "OTP verification",
          });
        }
        const { expiresAt } = otpExists;
        // checking if otp expired or not
        let time = Date.now();
        if (expiresAt < time) {
          await otpCollection.deleteOne({ otp: otp });
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
            referralCode : req.session.referralCode,
            createdAt: Date.now(),
          };
          await userCollection.insertMany([userData]);
          
          //user's referral code generation
          const userReferralCode = await generateReferralCode(8);
          const user = await userCollection.findOne({email:req.session.useremail})
          const newReferralCode = new referralCodeCollection({
            userId : user._id,
            referralCode : userReferralCode
          })
          await newReferralCode.save();

          //creating new wallet for user
          const newWallet = new walletCollection({
            userId : user._id
          })
          await newWallet.save();

          await otpCollection.deleteOne({ otp: otp });
          res.render("user/userLogin", { title: "Login" });
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
        if (!otpExists) {
          return res.render("user/userResendOTP", {
            message: "OTP not found....check once more",
          });
        }
        const { expiresAt } = otpExists;
        // checking if otp expired or not
        let time = Date.now();
        if (expiresAt < time) {
          await otpCollection.deleteOne({ otp: otp });
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
            referralCode : req.session.referralCode,
            createdAt: Date.now(),
          };
          await userCollection.insertMany([userData]);
          await otpCollection.deleteOne({ otp: otp });
          const userReferralCode = await generateReferralCode(8);
          const userId = await userCollection.findOne({email:req.session.useremail})
          const newReferralCode = new referralCodeCollection({
            userId : userId._id,
            referralCode : userReferralCode
          })
          await newReferralCode.save();
          //creating new wallet for user
          const newWallet = new walletCollection({
            userId : user._id
          })
          await newWallet.save();
          //deleting the otp
          await otpCollection.deleteOne({ otp: otp });
          res.render("user/userLogin");
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
      if (!email) {
        return res.render("user/userForgetPassMail", {
          title: "Forget Password",
          message: "Email id is required",
        });
      }
      const user = await userCollection.findOne({ email: email });
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
};
