const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    userId: {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'users',
        required : true
    },
    products: [{
        productId : {
            type : mongoose.Schema.Types.ObjectId,
            ref : 'products',
            required : true
        },
        quantity : {
            type : Number,
            required : true,
        },
        orderStatus:{
            type : String,
            default : "pending"
        }
    }]
})

module.exports = mongoose.model('cart',cartSchema);