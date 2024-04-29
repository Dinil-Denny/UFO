const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    categoryName : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'category'
    },
    offerPercentage : {
        type : Number,
        required : true
    },
    offerExpiryDate : {
        type : Date,
        required : true
    },
    isActive : {
        type : Boolean,
        default : true
    }
})

module.exports = new mongoose.model('offers',offerSchema);