const mongoose = require('mongoose');

const referralCodeSchema = new mongoose.Schema({
    userId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'users'
    },
    referralCode : {
        type:String,
        unique : true
    }
})

module.exports = mongoose.model('refferalCode',referralCodeSchema)