const addressCollection = require('../model/userAddressSchema');
const userCollection = require('../model/userSchema');
const orderCollection = require('../model/orderSchema');
const mongoose = require('mongoose');
module.exports = {
    // accoutn overview
    getAccountOverview : async(req,res)=>{
        try {
          const userid = req.session.userid;
          const user = await userCollection.findOne({email:userid}).lean();
        //   console.log("userId",userid);
          const orders = await orderCollection.find({userId:user._id}).populate('productsData.productId').sort({date:-1}).lean();
          console.log("ordres: ",orders);
          const addresses = await addressCollection.find().lean();
        //   console.log("addresses: ",addresses);
        //   console.log(`user in account overview: ${user}`);
          res.render('user/accountOverview',{title:"Account overview",loginName:req.session.username,user,addresses,orders});
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
                    $project:{
                        productsData:1,name:1,houseName:1,street:1,city:1,state:1,pinCode:1,mobileNumber:1,paymentMethod:1,orderStatus:1,totalPrice:1,date:1,
                        productName:"$orderedProducts.productName",
                        productImages:"$orderedProducts.images",
                        quantity:"$productsData.quantity",
                        productPrice:"$orderedProducts.offerPrice",
                        brandName:"$orderedProducts.brandName",
                        gender:"$orderedProducts.gender",
                        size:"$orderedProducts.size",
                        color:"$orderedProducts.color"
                        
                    }
                }
            ]);
            console.log("orderDetails: ",orderDetails);
            res.render('user/orderDetails',{title:"Order Details",orderDetails});
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
            const orderDetails = await orderCollection.findOneAndUpdate({_id:new mongoose.Types.ObjectId(orderId)},
                {$set:{"productsData.$[product].orderStatus":"cancelled"}},
                {arrayFilters:[{"product._id":{$eq:new mongoose.Types.ObjectId(productsDataId)}}]});
            
            res.redirect(`/orderDetails/${orderId}`);
        }catch(err){
            console.log("Error while cancelling product-order: ",err.message);
        }
        
    },
    
    getAddnewAddress: async(req,res,next)=>{
        try {
            
            res.render('user/userNewAddress',{title:"Add address",loginName:req.session.username});
        } catch (error) {
            console.log("Error in gettin add address form: ",error.message);
        }
    },
    postAddnewAddress: async(req,res,next)=>{
        try {
            const{name,mobileNumber,address,street,city,state,pinCode} = req.body;
            console.log("req.body: ",req.body);
            const userAddress = {
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
    }
}