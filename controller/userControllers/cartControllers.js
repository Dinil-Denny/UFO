const Cart = require('../../model/cartSchema');
const Product = require('../../model/productSchema');
const User = require('../../model/userSchema');
const Address = require('../../model/userAddressSchema');
const Orders = require('../../model/orderSchema');
const Wishlist = require('../../model/wishlistSchema');
const wishlistSchema = require('../../model/wishlistSchema');

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
            for(let i=0;i<cartProducts.length;i++){
                let itemExist = cartProducts[i].productId.stock>0;
                if(itemExist===false){
                    await Cart.updateOne({_id:userCart._id,"products.productId":cartProducts[i].productId._id},
                        {$pull:{products:{productId:cartProducts[i].productId._id}}}
                    );
                    cartProducts.splice(i,1);
                    i--;
                }
            }
            // let subTotal = 0;
            // let total = 0;
            cartProducts.forEach( item =>{
                subTotal += (item.productId.offerPrice * item.quantity);
                total += (item.productId.price * item.quantity);
            }); 
            subTotal = subTotal.toFixed(2);
            total = total.toFixed(2);
            let discount = total - subTotal;
            discount = discount.toFixed(2);
            res.render('user/cart',{title:"Cart",userCart,loginName: req.session.username,subTotal,total,discount});

        } catch (error) {
            console.log("Error while fetching cart : ",error);
            res.render('user/userError',{title:"Error!",loginName: req.session.username});
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
                await cart.save();
            }
            res.json({succesMessage:"Item added to cart"});
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
            let total = 0;
            cartProducts.forEach( item =>{
                subTotal += (item.productId.offerPrice * item.quantity);
                total += (item.productId.price * item.quantity);
            }); 
            subTotal = subTotal.toFixed(2);
            total = total.toFixed(2);
            let discount = total - subTotal;
            discount = discount.toFixed(2);
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
            const data = {productId: productUpdated.products.productId,quantity:productUpdated.products.quantity,subtotal:subTotal,total:total,discount:discount}
            res.json({message:"quantity updated successfully",data : data});
            
        } catch (error) {
            console.log("Error while updating product quantity: ",error);
            res.status(500).json({message:"Error in updating cart quantity"});
        }
    },
    getWishlist : async(req,res)=>{
        try {
            const user = await User.findOne({email:req.session.userid});
            const wishlist = await Wishlist.findOne({user:user._id},{products:1}).populate({path:'products.productId',populate:{path:'brandName'}}).lean();
            let products = null 
            if(wishlist){
                products = wishlist.products.sort((a,b)=>{
                    const dateA = new Date(a.dateCreated);
                    const dateB = new Date(b.dateCreated);
                    return dateB-dateA;
                });
            }
            res.render('user/userWishlist',{title:"Wishlist",products,loginName: req.session.username});
        } catch (error) {
            console.log("error while getting wishlist:",error.message);
        }
    },
    //add and remove from wishlist 
    wishlistControl : async(req,res)=>{
        try{
            const user = await User.findOne({email:req.session.userid});
            const productId = req.params.id;
            const existingWishlist = await Wishlist.findOne({user:user._id});
            if(!existingWishlist){
                const newWishlist = new Wishlist({
                    user,
                    products : [{productId}]
                })
                await newWishlist.save();
            }else{
                const productExist = existingWishlist.products.findIndex(product => product.productId.toString() === productId.toString());
                if(productExist !== -1){
                    existingWishlist.products.splice(productExist,1);
                    await existingWishlist.save();
                }else{
                    existingWishlist.products.push({productId});
                    await existingWishlist.save();
                }
            }
            res.redirect('/productDetails/'+productId);
        }catch(err){
            console.log("Error while adding to wishlist: ",err.message);
        }
    }
}