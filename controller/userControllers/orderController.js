const Cart = require('../../model/cartSchema');
const Product = require('../../model/productSchema');
const User = require('../../model/userSchema');
const Address = require('../../model/userAddressSchema');
const Orders = require('../../model/orderSchema');

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
            total = total.toFixed(2);
            let discount = total - subTotal;
            discount = discount.toFixed(2);
            res.render('user/checkout',{userAddress,subTotal,total,discount,userId,userCartId,loginName: req.session.username,title:"Checkout"});
        } catch (error) {
            
        }
    },

    postCartCheckout : async(req,res)=>{
        try {
            console.log("req.body",req.body);
            const {userAddressId,cartTotal,userCartId,userId,paymentMethod,couponDiscount,couponApplied} = req.body;
            if(!userAddressId) return res.redirect('/checkout');
            console.log(userAddressId,cartTotal,userCartId,userId,paymentMethod);
            await Cart.updateMany({_id:userCartId},{$set:{"products.$[].orderStatus":"placed"}});
            const userCart = await Cart.findOne({_id: userCartId});
            console.log("updatedCartProducts:",userCart);
            const userAddress = await Address.findOne({_id:userAddressId});
            const cartProduts = userCart.products;//cartProducts is array of products and quantity
            console.log("cartProduts: ",cartProduts);

            //creating order collection
            const newOrder = new Orders ({
                userId,
                productsData : cartProduts,
                name:userAddress.name,
                houseName:userAddress.address,
                street:userAddress.street,
                city:userAddress.city,
                state:userAddress.state,
                pinCode:userAddress.pinCode,
                mobileNumber:userAddress.mobileNumber,
                paymentMethod,
                totalPrice : cartTotal,
                couponDiscount,
                couponApplied
            })
            await newOrder.save();
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
            res.redirect('/orderSuccess');
        } catch (error) {
            console.log("Error occured: ",error);
        }
    },

    getOrderSuccessPage: async(req,res)=>{
        try {
            res.render('user/orderSuccess',{loginName: req.session.username, title:"Order-Placed"});
        } catch (error) {
            console.log("Error !!: ",error);
        }
    }
}