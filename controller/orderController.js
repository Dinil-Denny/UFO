const Cart = require('../model/cartSchema');
const Product = require('../model/productSchema');
const User = require('../model/userSchema');
const Address = require('../model/userAddressSchema');
const Orders = require('../model/orderSchema');

module.exports = {
    getCartCheckout : async(req,res)=>{
        try {
            const userAddress = await Address.find().lean();
            const user = await User.findOne({email : req.session.userid});
            const userId = user._id;
            const userCart = await Cart.findOne({userId}).populate('products.productId');
            const userCartId = userCart._id;
            console.log("userCart.products: ",userCart.products);
            //cart subtotal
            let cartProducts = userCart.products;
            let subTotal = 0;
            cartProducts.forEach( item =>{
                subTotal += (item.productId.offerPrice * item.quantity);
            }); 
            subTotal = subTotal.toFixed(2);
            res.render('user/checkout',{userAddress,subTotal,userId,userCartId,loginName: req.session.username,title:"Checkout"});
        } catch (error) {
            
        }
    },

    postCartCheckout : async(req,res)=>{
        try {
            const {userAddressId,cartTotal,userCartId,userId,paymentMethod} = req.body;
            console.log(userAddressId,cartTotal,userCartId,userId,paymentMethod);
            const userCart = await Cart.findOne({_id: userCartId})
            console.log("userCart: ",userCart);
            const cartProduts = userCart.products;
            console.log("cartProduts: ",cartProduts);
            //creating order collection
            const newOrder = new Orders ({
                userId,
                productsData : userCart.products,
                address : userAddressId,
                paymentMethod,
                totalPrice : cartTotal,
            })
            await newOrder.save();
            //updating the product stock in product collecion
            for(const{productId,quantity} of cartProduts){
                try {
                    await Product.findOneAndUpdate({_id:productId},{$inc:{stock: -quantity}})
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