const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    couponCode : {
        type: String,
        required : true,
        unique : true,
        trim : true //removes leading or trialing spaces
    },
    discount : {
        type : Number,
        required : true,
        min : 5,
        max : 90
    },
    minimumSpend : {
        type : Number,
        default : 0,
        required : true
    },
    isActive : {
        type : Boolean,
        default : true,
        required : true
    },
    createdAt : {
        type : Date,
        default : new Date()
    },
    expiryAt : {
        type : Date,
        required : true
    }
})

module.exports = new mongoose.model('coupons',couponSchema);