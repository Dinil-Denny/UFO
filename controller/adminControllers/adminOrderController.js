const Cart = require('../../model/cartSchema');
const Product = require('../../model/productSchema');
const User = require('../../model/userSchema');
const Address = require('../../model/userAddressSchema');
const Orders = require('../../model/orderSchema');
const mongoose = require('mongoose');

module.exports = {
    getOrders : async(req,res)=>{
        try {
            const orders = await Orders.find().sort({date:-1}).lean();
            console.log("orders: ",orders);
            const dateFormattedOrders = orders.map(order=>{
                const formattedDate = order.date.toLocaleDateString();
                console.log("formattedDate",formattedDate);
                return {...order,date:formattedDate};
            })
            res.render('admin/adminOrders',{admin:true,adminName:req.session.admin,dateFormattedOrders,title:"Orders"});
        } catch (error) {
            console.log("Error: ",error);
        }
    },

    getOrderDetails : async(req,res)=>{
        try {
            const orderId = req.params.id;
            const orders = await Orders.aggregate([
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
                    $unwind : "$orderedProducts"
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
                        color:"$orderedProducts.color"
                        
                    }
                }
            ]);
            console.log("orders: ",orders);
            res.render('admin/adminOrderDetails',{admin:true,adminName:req.session.admin,orders,title:"Order details"});
        } catch (error) {
            console.log("Error !!: ",error);
        }
    },
    updateOrderStatus: async(req,res)=>{
        try {
            const{value,orderId,productsDataId} = req.body;
            console.log(req.body);
            console.log(value,orderId,productsDataId);
            await Orders.findOneAndUpdate({_id:new mongoose.Types.ObjectId(orderId)},
                {$set:{"productsData.$[product].orderStatus":value}},
                {arrayFilters:[{"product._id":{$eq:new mongoose.Types.ObjectId(productsDataId)}}]})
            const order = await Orders.aggregate([
                {
                    $match:{_id:new mongoose.Types.ObjectId(orderId)}
                },
                {
                    $project:{productsData:1}
                },
                {
                    $unwind:"$productsData"
                },
                {
                    $match:{'productsData._id':new mongoose.Types.ObjectId(productsDataId)}
                }
            ])

            console.log("order:",order);
            console.log(order[0].productsData.orderStatus);
            const data = {orderStatus:order[0].productsData.orderStatus,productsDataId:productsDataId}
            res.json({data});
        } catch (error) {
            console.log("Error while updating order status: ",error);
        }
    }
}