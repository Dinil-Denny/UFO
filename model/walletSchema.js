 const mongoose = require('mongoose');

 const walletSchema = new mongoose.Schema({
    userId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'users',
        required : true
    },
    walletBalance : {
        type : Number,
        required : true,
        default : 0
    },
    transactionHistory : [{
        transactionAmount : {
            type : Number,
            required : true
        },
        transactionType : {
            type : String, //deposit or withdrawal
            required : true
        },
        transactionDate : {
            type : Date,
            default : Date.now()
        }
    }]
 });

 module.exports = mongoose.model('wallet',walletSchema);