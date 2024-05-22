const addressCollection = require('../../model/userAddressSchema');
const userCollection = require('../../model/userSchema');
const orderCollection = require('../../model/orderSchema');
const productCollection = require('../../model/productSchema');
const walletCollection = require('../../model/walletSchema');
const referralCodeCollection = require('../../model/referralCodeSchema');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

module.exports = {
    // accoutn overview - here ordered products list is shown
    getAccountOverview : async(req,res)=>{
        try {
          const userid = req.session.userid;
          const user = await userCollection.findOne({email:userid}).lean();
          //console.log("userId",userid);
          const orders = await orderCollection.find({userId:user._id}).populate('productsData.productId').sort({date:-1}).lean();
          //console.log("ordres: ",orders);
          const dateFormattedOrders = orders.map((order)=>{
            const orderedDate = order.date;
            const formattedDate = orderedDate.toLocaleDateString();
            return {...order,date:formattedDate}
          })
          console.log("dateFormattedOrders:",dateFormattedOrders);
          const addresses = await addressCollection.find({userEmail:userid}).lean();
          const referralCode = await referralCodeCollection.findOne({userId:user._id}).lean();
          console.log("referralCode: ",referralCode);
          //console.log(`user in account overview: ${user}`);
          res.render('user/accountOverview',{title:"Account overview",loginName:req.session.username,user,addresses,dateFormattedOrders,referralCode:referralCode.referralCode});
        } catch (error) {
          console.log(`An error occured on loading account overview : ${error}`);
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
                        productsData:1,shippingAddress:1,paymentMethod:1,orderStatus:1,totalPrice:1,date:1,
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
            console.log("orderDetails:",orderDetails);
            res.render('user/orderDetails',{title:"Order Details",orderDetails,loginName:req.session.username});
        } catch (error) {
            console.log("error: ",error);
        }
    },

    cancelProduct: async(req,res)=>{
        try{
            const orderId = req.params.orderId;
            console.log("orderId: ",orderId);
            const productsDataId = req.params.productObjId;
            console.log("orderProductId: ",productsDataId);
            await orderCollection.findOneAndUpdate({_id:new mongoose.Types.ObjectId(orderId)},
                {$set:{"productsData.$[product].orderStatus":"cancelled"}},
                {arrayFilters:[{"product._id":{$eq:new mongoose.Types.ObjectId(productsDataId)}}]});
            res.redirect(`/orderDetails/${orderId}`);
        }catch(err){
            console.log("Error while cancelling product-order: ",err.message);
        }
        
    },
    
    returnProduct: async(req,res)=>{
        try {
            const orderId = req.params.orderId;
            console.log("orderId: ",orderId);
            const productsDataId = req.params.productObjId;
            console.log("orderProductId: ",productsDataId);
            await orderCollection.findOneAndUpdate(
                {_id:new mongoose.Types.ObjectId(orderId)},
                {$set:{"productsData.$[product].orderStatus":"returned"}},
                {arrayFilters:[{"product._id":{$eq:new mongoose.Types.ObjectId(productsDataId)}}]}
            );
            const orderDetails = await orderCollection.findOne({_id:new mongoose.Types.ObjectId(orderId)});
            const totalProductsInOrder = orderDetails.productsData.length;
            const couponDiscount = orderDetails.couponDiscount;
            const couponDiscountForEachProduct = (couponDiscount/totalProductsInOrder);
            console.log("couponDiscountForEachProduct:",couponDiscountForEachProduct);
            const orderedProduct = orderDetails.productsData.find(val => {
                return val._id.equals(new mongoose.Types.ObjectId(productsDataId))
            });
            console.log("orderedProduct",orderedProduct);
            const orderedProductDetails = await productCollection.findOne({_id:orderedProduct.productId});
            console.log("orderedProductDetails",orderedProductDetails);
            const refundAmount = ((orderedProductDetails.offerPrice * orderedProduct.quantity) - couponDiscountForEachProduct).toFixed(2);
            console.log("refundAmt:",refundAmount);

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
        }
    },
    
    getAddnewAddress: async(req,res,next)=>{
        try {
            //console.log("userid:",req.session.userid)
            res.render('user/userNewAddress',{title:"Add address",loginName:req.session.username,userEmail:req.session.userid});
        } catch (error) {
            console.log("Error in gettin add address form: ",error.message);
        }
    },
    postAddnewAddress: async(req,res,next)=>{
        try {
            const{userEmail,name,mobileNumber,address,street,city,state,pinCode} = req.body;
            console.log("req.body: ",req.body);
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
            console.log("address saved");
            res.redirect('/account_overview');
            
            
        } catch (error) {
            console.log("Error in adding new address: ",error.message);
        }
    },
    getEditAddress: async(req,res,next)=>{
        try {
            const address = await addressCollection.findById(req.params.id).lean();
            console.log("Edit address: ",address);
            res.render('user/editAddress',{title:"Edit address",address});
        } catch (error) {
            console.log(`An error occured: ${error.message}`);
        }
    },
    postEditAddress: async(req,res,next)=>{
        try {
            const {name,mobileNumber,address,street,city,state,pinCode} = req.body;
            console.log("req.body: ",req.body);
            console.log("Object id : ",req.params.id);
            await addressCollection.findByIdAndUpdate(req.params.id,{name,mobileNumber,address,street,city,state,pinCode});
            res.redirect('/account_overview');
        } catch (error) {
            console.log("Error in editing address: ",error.message)
        }
    },
    deleteAddress : async(req,res,next)=>{
        try{
            await addressCollection.findByIdAndUpdate(req.params.id,{isActive:false});
            console.log("Address soft deleted");
            res.redirect('/account_overview');
        }catch(error){
            console.log("Error while deleting address: ",error.message);
        }
    },
    getEditDetails: async(req,res,next)=>{
        try {
            const user = await userCollection.findById(req.params.id).lean();
            console.log("user to edit details: ",user);
            res.render('user/editDetails',{title:"Edit details",user})

        } catch (error) {
            console.log(`Error : ${error.message}`);
        }
    },
    postEditDetails: async(req,res,next)=>{
        try {
            const {name,email,mobileNumber} = req.body;
            console.log("req.body: ",req.body);
            await userCollection.findByIdAndUpdate(req.params.id,{name,email,mobileNumber});
            console.log("user details saved");
            res.redirect('/account_overview');
        } catch (error) {
            console.log(`Error : ${error.message}`);
        }
    },
    getChangePassword : async(req,res)=>{
        try {
            const user = await userCollection.findById(req.params.id).lean();
            res.render('user/changePassword',{title:"Change Password",user});
        } catch (error) {
            console.log("Error while changing password: ",error.message);
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
        }
    }
}