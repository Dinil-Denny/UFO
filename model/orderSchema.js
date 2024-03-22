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
    address : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'address',
        required : true
    },
    paymentMethod : {
        type : String,
        required : true
    },
    paymentStatus : {
        type: String,
        default : 'pending'
    },
    orderStatus : {
        type : String,
        default : 'placed'
    },
    totalPrice : {
        type : Number,
        required : true
    },
    date : {
        type : String,
        required : true,
        default : new Date().toLocaleString()
    },
})

module.exports = mongoose.model('orders',orderSchema);