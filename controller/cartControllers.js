const Cart = require('../model/cartSchema');
const Product = require('../model/productSchema');
const User = require('../model/userSchema');
const Address = require('../model/userAddressSchema');
const Orders = require('../model/orderSchema');

module.exports = {
    getCart : async(req,res)=>{
        const userEmail = req.session.userid;
        try {
            const user = await User.findOne({email:userEmail});
            const userId = user._id;
            const userCart = await Cart.findOne({userId}).populate({path:'products.productId',populate:{path:'brandName'}}).lean();
            
            if(!userCart) 
                return res.render('user/cart',{title:"Cart",loginName: req.session.username});

            let cartProducts = userCart.products;
            let subTotal = 0;
            cartProducts.forEach( item =>{
                console.log(item.productId.brandName)
                console.log("item : ",item.productId.offerPrice);
                subTotal += (item.productId.offerPrice * item.quantity);
            }); 
            subTotal = subTotal.toFixed(2);
            
            res.render('user/cart',{title:"Cart",userCart,loginName: req.session.username,subTotal});

            // ---------------------testing--------------------
            // const cartItems = userCart.products;
            // console.log("cartItems: ",cartItems);
            // cartItems.forEach(val => {
            //     console.log("img-val: ",val.productId.images[0]);
            // });
            //-------------------------------------------------

        } catch (error) {
            console.log("Error while fetching cart : ",error)
        }
    },
    addToCart : async(req,res)=>{
        const productId = req.params.id;
        const userEmail = req.session.userid;
        const user = await User.findOne({email:userEmail});
        const userId = user._id;
        // default quantity is 1
        const quantity = 1;
        try {
            // cart exist 
            const cart = await Cart.findOne({userId : user._id});
            // console.log("cart finding");
            if(!cart){
                const newCart = new Cart({
                    userId,
                    products : [{productId,quantity}]
                })
                await newCart.save();
            }else{
                const existingProduct = cart.products.find(product => product.productId.toString() === productId);
                if(existingProduct)
                    existingProduct.quantity += quantity;
                else
                    cart.products.push({productId, quantity});

                // checking if product is in stock
                const product = await Product.findById(productId);
                // if(product.stock < quantity)
                //     res.redirect('/productDetails/'+productId);
                await cart.save();
            }
            
            res.redirect('/productDetails/'+productId);
        } catch (error) {
            console.log("Error while adding product to cart: ",error);
        }
    },
    removeItemInCart : async(req,res)=>{
        try {
            const productId = req.params.id;
            const userEmail = req.session.userid;
            const user = await User.findOne({email:userEmail});
            const userId = user._id;
            await Cart.updateOne({userId},{$pull:{products:{productId}}});
            res.redirect('/cart');
        } catch (error) {
            console.log("Error occure while removing product from cart: ",error);
        }
    },

    updateCartQuantity : async(req,res)=>{
        const {productId,quantity} = req.body;
        // console.log("req.body: ",req.body);
        // console.log("productId: ",productId);
        // console.log(req.session.userid);
        try {
            const user = await User.findOne({email : req.session.userid});
            const userId = user._id;
            const cart = await Cart.findOne({userId:userId});
            await Cart.findOneAndUpdate(
                {userId:userId, 'products.productId':productId},
                {$set:{'products.$.quantity':quantity}}
            );
            const userCart = await Cart.findOne({userId:userId}).populate('products.productId');
            //cart subtotal
            let cartProducts = userCart.products;
            let subTotal = 0;
            cartProducts.forEach( item =>{
                console.log("item : ",item.productId.offerPrice);
                subTotal += (item.productId.offerPrice * item.quantity);
            }); 
            subTotal = subTotal.toFixed(2);
            // updated product quantity
            const quantityUpdated = await Cart.aggregate([
                {
                    $match:{userId:userId}
                },
                {
                    $project:{products:1,_id:0}
                },
                {
                    $unwind:"$products"
                },
            ])
            const productUpdated = quantityUpdated.find(object => object.products.productId == productId);
            const data = {productId: productUpdated.products.productId,quantity:productUpdated.products.quantity,subtotal:subTotal}
            res.json({message:"quantity updated successfully",data : data});
            
        } catch (error) {
            console.log("Error while updating product quantity: ",error);
            res.status(500).json({message:"Error in updating cart quantity"});
        }
    },
    

}