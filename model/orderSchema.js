const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'users',
        required : true
    },
    productsData : [{
        productId : {
            type : mongoose.Schema.Types.ObjectId,
            ref : 'products'
        },
        quantity : {
            type : Number 
        },
        orderStatus : {
            type : String
        }
    }],
    shippingAddress : {
        name:{
            type : String
        },
        houseName:{
            type : String
        },
        street:{
            type : String
        },
        city:{
            type : String
        },
        state:{
            type : String
        },
        pinCode:{
            type : String
        },
        mobileNumber:{
            type : Number
        }
    },
    paymentMethod : {
        type : String,
        required : true
    },
    paymentStatus : {
        type: String,
        default : 'pending'
    },
    totalPrice : {
        type : Number,
        required : true
    },
    date : {
        type : Date,
        required : true,
        default : new Date().toISOString().slice(0, 10)
    },
    couponApplied : {
        type : String,
    },
    productPriceDiscount:{
        type: Number
    },
    couponDiscount : {
        type : Number,
    }
})

module.exports = mongoose.model('orders',orderSchema);