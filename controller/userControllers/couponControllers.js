const couponsCollection = require('../../model/couponSchema');
const userCollection = require('../../model/userSchema');
const cartCollection = require('../../model/cartSchema');
const orderCollection = require('../../model/orderSchema');

module.exports = {
    getCoupons : async(req,res)=>{
        try {
            const coupons = await couponsCollection.find().lean();
            res.render('user/coupons',{title:"Coupons",loginName: req.session.username,coupons});
        } catch (err) {
            console.log("Error while getting coupons:",err.message);
        }
    },
    couponCodeValidation : async(req,res)=>{
        try {
            const {couponCode} = req.body
            let codDisabled = false;
            const user = await userCollection.findOne({email : req.session.userid});
            const userId = user._id;

            const userCart = await cartCollection.findOne({userId}).populate('products.productId');
            let cartProducts = userCart.products;
            let subTotal = 0;
            cartProducts.forEach( item =>{
                subTotal += (item.productId.offerPrice * item.quantity);
            }); 
            subTotal = subTotal.toFixed(2);
            if(subTotal>1000) {
                codDisabled = true;
            }
            const couponExist = await couponsCollection.findOne({couponCode:couponCode});
            if(!couponExist){
                return res.json({message:"No coupon available. Enter correct coupon code",codDisabled});
            }
            
            // checking if coupon already used in previous orders
            const couponUsed = await orderCollection.findOne({userId:userId,couponApplied:couponCode});
            if(couponUsed){
                return res.json({message:`Coupon already redeemed`,codDisabled});
            }
            if(subTotal>1000) {
                codDisabled = true;
            }
            if(subTotal<couponExist.minimumSpend){
                let remainingAmout = (couponExist.minimumSpend - subTotal);
                return res.json({message:`Add products worth Rs. ${remainingAmout} to redeem the coupon`,codDisabled});
            }
            const couponDiscountAmount = (couponExist.discount*subTotal)/100;
            const newTotal = subTotal-couponDiscountAmount;
            if(newTotal>1000) {
                codDisabled = true;
            }
            res.json({couponDiscountAmount:couponDiscountAmount,newTotal:newTotal.toFixed(2),appliedCouponCode:couponExist.couponCode,message:"Coupon applied successfully",codDisabled});

        } catch (err) {
            console.log("Error while validating coupon:",err.message);
        }
    }
}