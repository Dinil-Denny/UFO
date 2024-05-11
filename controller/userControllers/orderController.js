const Cart = require('../../model/cartSchema');
const Product = require('../../model/productSchema');
const User = require('../../model/userSchema');
const Address = require('../../model/userAddressSchema');
const Orders = require('../../model/orderSchema');
const Wallet = require('../../model/walletSchema');
const RefferalCode = require('../../model/referralCodeSchema');
const mongoose = require('mongoose');

//razorpay
const Razorpay = require('razorpay');
const crypto = require('crypto');
require('dotenv').config();

var instance = new Razorpay({
    key_id: process.env.RZP_KEY_ID,
    key_secret: process.env.RZP_KEY_SECRET,
});

module.exports = {
    getCartCheckout : async(req,res)=>{
        try {
            const userAddress = await Address.find({userEmail:req.session.userid}).lean();
            const user = await User.findOne({email : req.session.userid});
            const userId = user._id;
            const userCart = await Cart.findOne({userId}).populate('products.productId');
            const userCartId = userCart._id;
            //console.log("userCart.products: ",userCart.products);
            //cart subtotal
            let cartProducts = userCart.products;
            let total = 0;
            let subTotal = 0;
            cartProducts.forEach( item =>{
                subTotal += (item.productId.offerPrice * item.quantity);
                total += (item.productId.price * item.quantity);
            }); 
            subTotal = subTotal.toFixed(2);
            let codDisabled = false;
            if(subTotal>1000){
                codDisabled = true;
            }
            total = total.toFixed(2);
            let discount = total - subTotal;
            discount = discount.toFixed(2);
            res.render('user/checkout',{userAddress,subTotal,total,discount,userId,userCartId,loginName: req.session.username,title:"Checkout",codDisabled});
        } catch (error) {
            console.log("Error while getting cart to checkout:",error.message);
        }
    },

    postCartCheckout : async(req,res)=>{
        try {
            //console.log("req.body",req.body);
            const {userAddressId,cartTotal,userCartId,userId,paymentMethod,couponDiscount,couponApplied,productPriceDiscount} = req.body;
            if(!userAddressId) return res.redirect('/checkout');
            //console.log(userAddressId,cartTotal,userCartId,userId,paymentMethod);
            //updating the ordered product status to 'placed' from 'pending'.
            //await Cart.updateMany({_id:userCartId},{$set:{"products.$[].orderStatus":"placed"}});
            const userCart = await Cart.findOne({_id: userCartId});
            //console.log("updatedCartProducts:",userCart);
            const userAddress = await Address.findOne({_id:userAddressId});
            const cartProduts = userCart.products;//cartProducts is array of products and quantity
            //console.log("cartProduts: ",cartProduts);

            //creating order collection
            const newOrder = new Orders ({
                userId,
                productsData : cartProduts,
                shippingAddress : {
                    name:userAddress.name,
                    houseName:userAddress.address,
                    street:userAddress.street,
                    city:userAddress.city,
                    state:userAddress.state,
                    pinCode:userAddress.pinCode,
                    mobileNumber:userAddress.mobileNumber,
                },
                paymentMethod,
                totalPrice : cartTotal,
                couponApplied,
                productPriceDiscount,
                couponDiscount,
                
            })
            console.log("newOrder:",newOrder);
            await newOrder.save();

            if(paymentMethod === "COD"){
                newOrder.paymentStatus = 'COD';
                await newOrder.save();
                res.json({redirect:'/orderSuccess'});
            }

            if(paymentMethod === "ONLINE"){
                const options = {
                    amount: cartTotal*100,
                    currency:"INR",
                    receipt: crypto.randomBytes(10).toString("hex")
                }
                const order = await instance.orders.create(options);
                //console.log("razorpay order:",order);
                res.json({order,razorpayKey:process.env.RZP_KEY_ID,orderId:newOrder._id});
            }

            //updating the wallet balace for referral cash back
            const user = await User.findOne({email : req.session.userid});
            const userOrders = await Orders.find({userId:user._id});
            //console.log("userOrders:",userOrders);
            if(user.referralCode){
                if(userOrders.length <= 1){
                    const userSharedRefCode = await RefferalCode.findOne({referralCode:user.referralCode});
                    const walletOfuserSharedRefCode = await Wallet.findOne({userId:userSharedRefCode.userId});
                    if(walletOfuserSharedRefCode){
                        await Wallet.findOneAndUpdate({userId:userSharedRefCode.userId},{$inc:{walletBalance:100}});
                        walletOfuserSharedRefCode.transactionHistory.push({transactionAmount:100,transactionType:"credit"});
                        walletOfuserSharedRefCode.save();
                    }
                    const walletExist = await Wallet.findOne({userId:user._id});
                    if(walletExist){
                        await Wallet.findOneAndUpdate({userId:user._id},{$inc:{walletBalance:100}});
                        walletExist.transactionHistory.push({transactionAmount:100,transactionType:"credit"});
                        walletExist.save();
                    }
                }
            }
            
            //updating the product stock in product collecion
            for(const{productId,quantity} of cartProduts){
                try {
                    await Product.findOneAndUpdate({_id:productId},{$inc:{stock: -quantity}});
                } catch (error) {
                    console.log("error while updating stock: ",error);
                }
            }

            //deleteing the cart after placing the order
            await Cart.findOneAndDelete({_id: userCartId});
            
        } catch (error) {
            console.log("Error occured while checkout: ",error.message);
        }
    },  

    verifyRazorpayPayment : async(req,res)=>{
        try {
            const razorpay_order_id = req.body.response.razorpay_order_id;
            const razorpay_payment_id = req.body.response.razorpay_payment_id;
            const razorpay_signature = req.body.response.razorpay_signature;
            const orderId = req.body.orderId;
            console.log("verifyRazorpayPayment req.body:",req.body);
            const secret = process.env.RZP_KEY_SECRET;
            const sign = razorpay_order_id + "|" + razorpay_payment_id;
            const expectedSignature = crypto.createHmac('sha256',secret)
            .update(sign.toString())
            .digest('hex');
            console.log("expectedSignature:",expectedSignature);
            if(expectedSignature === razorpay_signature){
                await Orders.findOneAndUpdate({_id:new mongoose.Types.ObjectId(orderId)},{$set:{paymentStatus:"payed"}});
                return res.status(200).json({success:true});
            }else{
                return res.status(400).json({success:false});
            }
        } catch (err) {
            console.log("Error in verify payment:",err.message);
        }
    },

    getOrderSuccessPage: async(req,res)=>{
        try {
            res.render('user/orderSuccess',{loginName: req.session.username, title:"Order-Placed"});
        } catch (err) {
            console.log("Error !!: ",err.message);
        }
    },
    getOrderFailurePage: async(req,res)=>{
        try {
            res.render('user/orderFailure',{loginName: req.session.username, title:"Order-Failed"});
        } catch (err) {
            console.log("Error !!: ",err.message);
        }
    }
}