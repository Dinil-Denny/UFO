const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'users',
        required : true
    },
    productsData : {
        type: Array
    },
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
        type : String,
        required : true,
        default : ()=> new Date()
    },
    couponApplied : {
        type : String,
        required : true
    },
    couponDiscount : {
        type : Number,
        required : true
    }
})

module.exports = mongoose.model('orders',orderSchema);