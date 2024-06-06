const addressCollection = require('../../model/userAddressSchema');
const userCollection = require('../../model/userSchema');
const orderCollection = require('../../model/orderSchema');
const productCollection = require('../../model/productSchema');
const walletCollection = require('../../model/walletSchema');
const referralCodeCollection = require('../../model/referralCodeSchema');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const otpCollection = require("../../model/otpSchema");
const sendOTPVerificationMail = require("../../utils/otpVerificationMail");
const transporter = require("../../utils/mailTransporter");

module.exports = {
    // accoutn overview - here ordered products list is shown
    getAccountOverview : async(req,res)=>{
        try {
          const userid = req.session.userid;
          const user = await userCollection.findOne({email:userid}).lean();
          const orders = await orderCollection.find({userId:user._id}).populate('productsData.productId').sort({date:-1}).lean();
          const dateFormattedOrders = orders.map((order)=>{
            const orderedDate = order.date;
            const formattedDate = orderedDate.toLocaleDateString();
            return {...order,date:formattedDate}
          })
          const addresses = await addressCollection.find({userEmail:userid}).lean();
          const referralCode = await referralCodeCollection.findOne({userId:user._id}).lean();
          res.render('user/accountOverview',{title:"Account overview",loginName:req.session.username,user,addresses,dateFormattedOrders,referralCode:referralCode.referralCode});
        } catch (error) {
          console.log(`An error occured on loading account overview : ${error}`);
          res.render('user/userError',{title:"Error!",loginName: req.session.username});
        }
    },

    getOrderDetails: async(req,res)=>{
        try {
            const orderId = req.params.id;
            const orderDetails = await orderCollection.aggregate([
                {
                    $match:{_id: new mongoose.Types.ObjectId(orderId)}
                },
                {
                    $unwind:"$productsData"
                },
                {
                    $lookup:{
                        from:"products",
                        localField:"productsData.productId",
                        foreignField:"_id",
                        as:"orderedProducts"
                    }
                },
                {
                    $unwind:"$orderedProducts"
                }, 
                {
                    $lookup:{
                        from:"brands",
                        localField:"orderedProducts.brandName",
                        foreignField:"_id",
                        as:"brand"
                    }
                },  
                {
                    $project:{
                        productsData:1,shippingAddress:1,paymentMethod:1,orderStatus:1,totalPrice:1,date:1,orderedProducts:1,
                        productName:"$orderedProducts.productName",
                        productImages:"$orderedProducts.images",
                        quantity:"$productsData.quantity",
                        productPrice:"$orderedProducts.offerPrice",
                        brandName:"$brand.brandName",
                        gender:"$orderedProducts.gender",
                        size:"$orderedProducts.size",
                        color:"$orderedProducts.color",
                    }
                }
            ]);
            //console.log("orderDetails:",orderDetails);
            res.render('user/orderDetails',{title:"Order Details",orderDetails,loginName:req.session.username});
        } catch (error) {
            console.log("error: ",error);
            res.render('user/userError',{title:"Error!",loginName: req.session.username});
        }
    },

    cancelProduct: async(req,res)=>{
        try{
            const orderId = req.params.orderId;
            const productId = req.params.productId;
            const productsDataId = req.params.productObjId;
            const product = await orderCollection.aggregate([
                {
                    $match:{_id:new mongoose.Types.ObjectId(orderId)}
                },
                {
                    $unwind:"$productsData"
                },
                {
                    $match:{"productsData.productId":new mongoose.Types.ObjectId(productId)}
                },
                {
                    $project:{"productsData.quantity":1,_id:0}
                }
            ]);
            //changing the order status of product to "cancelled"
            await orderCollection.findOneAndUpdate({_id:new mongoose.Types.ObjectId(orderId)},
                {$set:{"productsData.$[product].orderStatus":"cancelled"}},
                {arrayFilters:[{"product._id":{$eq:new mongoose.Types.ObjectId(productsDataId)}}]});
            //incrementing the product stock while cancelling the product
            await productCollection.findOneAndUpdate({_id:new mongoose.Types.ObjectId(productId)},
                {$inc:{stock:product[0].productsData.quantity}});
            res.redirect(`/orderDetails/${orderId}`);
        }catch(err){
            console.log("Error while cancelling product-order: ",err.message);
            res.render('user/userError',{title:"Error!",loginName: req.session.username});
        }
        
    },
    
    returnProduct: async(req,res)=>{
        try {
            const orderId = req.params.orderId;
            const productsDataId = req.params.productObjId;
            await orderCollection.findOneAndUpdate(
                {_id:new mongoose.Types.ObjectId(orderId)},
                {$set:{"productsData.$[product].orderStatus":"returned"}},
                {arrayFilters:[{"product._id":{$eq:new mongoose.Types.ObjectId(productsDataId)}}]}
            );
            const orderDetails = await orderCollection.findOne({_id:new mongoose.Types.ObjectId(orderId)});
            const totalProductsInOrder = orderDetails.productsData.length;
            const couponDiscount = orderDetails.couponDiscount;
            const couponDiscountForEachProduct = (couponDiscount/totalProductsInOrder);
            const orderedProduct = orderDetails.productsData.find(val => {
                return val._id.equals(new mongoose.Types.ObjectId(productsDataId))
            });
            const orderedProductDetails = await productCollection.findOne({_id:orderedProduct.productId});
            const refundAmount = ((orderedProductDetails.offerPrice * orderedProduct.quantity) - couponDiscountForEachProduct).toFixed(2);

            //depositing the refund amount to the user's wallet, if no wallet create one and deposit the amount
            const user = await userCollection.findOne({email:req.session.userid}).lean();
            const walletExist = await walletCollection.findOne({userId:user._id});
            if(!walletExist){
                const newWallet = new walletCollection({
                    userId : user._id,
                    walletBalance : refundAmount,
                    transactionHistory : [{
                        transactionAmount : refundAmount,
                        transactionType : "credit"
                    }]
                })
                await newWallet.save();
            }
            if(walletExist){
                await walletCollection.findOneAndUpdate({userId:user._id},{$inc:{walletBalance:refundAmount}});
                walletExist.transactionHistory.push({transactionAmount:refundAmount,transactionType:"credit"});
                walletExist.save();
            }
            res.redirect(`/orderDetails/${orderId}`);
        } catch (error) {
            console.log("Error while returning the product: ",error.message);
            res.render('user/userError',{title:"Error!",loginName: req.session.username});
        }
    },
    
    getAddnewAddress: async(req,res,next)=>{
        try {
            res.render('user/userNewAddress',{title:"Add address",loginName:req.session.username,userEmail:req.session.userid});
        } catch (error) {
            console.log("Error in gettin add address form: ",error.message);
            res.render('user/userError',{title:"Error!",loginName: req.session.username});
        }
    },
    postAddnewAddress: async(req,res,next)=>{
        try {
            const{userEmail,name,mobileNumber,address,street,city,state,pinCode} = req.body;
            const userAddress = {
                userEmail,
                name,
                mobileNumber,
                address,
                street,
                city,
                state,
                pinCode 
            };
            await addressCollection.insertMany([userAddress]);
            res.redirect('/account_overview');
        } catch (error) {
            console.log("Error in adding new address: ",error.message);
            res.render('user/userError',{title:"Error!",loginName: req.session.username});
        }
    },
    getEditAddress: async(req,res,next)=>{
        try {
            const address = await addressCollection.findById(req.params.id).lean();
            res.render('user/editAddress',{title:"Edit address",address});
        } catch (error) {
            console.log(`An error occured: ${error.message}`);
            res.render('user/userError',{title:"Error!",loginName: req.session.username});
        }
    },
    postEditAddress: async(req,res,next)=>{
        try {
            const {name,mobileNumber,address,street,city,state,pinCode} = req.body;
            await addressCollection.findByIdAndUpdate(req.params.id,{name,mobileNumber,address,street,city,state,pinCode});
            res.redirect('/account_overview');
        } catch (error) {
            console.log("Error in editing address: ",error.message);
            res.render('user/userError',{title:"Error!",loginName: req.session.username});
        }
    },
    deleteAddress : async(req,res,next)=>{
        try{
            await addressCollection.findByIdAndUpdate(req.params.id,{isActive:false});
            res.redirect('/account_overview');
        }catch(error){
            console.log("Error while deleting address: ",error.message);
            res.render('user/userError',{title:"Error!",loginName: req.session.username});
        }
    },
    getEditDetails: async(req,res,next)=>{
        try {
            const user = await userCollection.findById(req.params.id).lean();
            res.render('user/editDetails',{title:"Edit details",user});
        } catch (error) {
            console.log(`Error : ${error.message}`);
            res.render('user/userError',{title:"Error!",loginName: req.session.username});
        }
    },
    postEditDetails: async(req,res,next)=>{
        try {
            const {name,mobileNumber} = req.body;
            await userCollection.findByIdAndUpdate(req.params.id,{name,mobileNumber});
            res.redirect('/account_overview');
        } catch (error) {
            console.log(`Error : ${error.message}`);
            res.render('user/userError',{title:"Error!",loginName: req.session.username});
        }
    },
    getEditEmail : async(req,res)=>{
        try {
            const user = await userCollection.findOne({_id:req.params.id}).lean();
            res.render('user/editEmail',{title:"Edit email",user});
        } catch (error) {
            console.log("Error while getting edit email:",error.message);
            res.render('user/userError',{title:"Error!",loginName: req.session.username});
        }
    },
    getEditEmailOTP : async(req,res)=>{
        try{
            const email = req.session.userid;
            const userOtpExist = await otpCollection.findOne({userId:email});
            if(userOtpExist){
                await otpCollection.deleteOne({ userId: email });
            }
            // generate otp
            const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
            // mail options
            const oneMinute = 1 * 60 * 1000;
            const mailOptions = {
                from: process.env.AUTH_MAIL,
                to: email,
                subject: "Verify your Email",
                html: `<p>Enter ${otp} to verify your account(OTP expires in 1 mins)</p>`,
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
            res.json({success:true});
        }catch(error){
            console.log("Error while getting otp: ",error.message);
            res.json({success:false});
        }
    },
    verigyEditEmail : async(req,res)=>{
        try{
            const otpExist = await otpCollection.findOne({userId:req.session.userid,otp:req.body.otp});
            console.log(otpExist);
            if(!otpExist){
                return res.json({success:false,message:"Invalid OTP! Try again"});
            }
            if(otpExist.expiresAt<Date.now()){
                return res.json({otpExpiry:true,message:"OTP expired"});
            }
            await userCollection.findOneAndUpdate(new mongoose.Types.ObjectId(req.body.userId),{email:req.body.email});
            await otpCollection.deleteOne({otp:req.body.otp});
            res.json({success:true,redirect:'/account_overview'});
        }catch(error){
            console.log("Error:",error.message);
            res.render('user/userError',{title:"Error!",loginName: req.session.username});
        }
    },
    getChangePassword : async(req,res)=>{
        try {
            const user = await userCollection.findById(req.params.id).lean();
            res.render('user/changePassword',{title:"Change Password",user});
        } catch (error) {
            console.log("Error while changing password: ",error.message);
            res.render('user/userError',{title:"Error!",loginName: req.session.username});
        }
    },
    postChangePassword: async(req,res)=>{
        try {
            const{newPassword,confirmPassword} = req.body;
            const user = await userCollection.findById(req.params.id).lean();
            if(!newPassword) return res.render('user/changePassword',{title:"Change Password",user,message:"Enter new password"});
            if(!confirmPassword) return res.render('user/changePassword',{title:"Change Password",user,message:"Enter confirm password"});
            if(newPassword !== confirmPassword) return res.render('user/changePassword',{title:"Change Password",user,message:"Both passwords should be same"});
            const hashedPassword = await bcrypt.hash(confirmPassword,10);
            await userCollection.findByIdAndUpdate({_id:req.params.id},{$set:{password:hashedPassword}});
            res.redirect('/account_overview');
        } catch (error) {
            console.log("Error while changing password: ",error.message);
            res.render('user/userError',{title:"Error!",loginName: req.session.username});
        }
    },
    
}