const mongoose = require('mongoose')

const brandSchema = new mongoose.Schema({
    brandName : {
        type : String,
        required : true
    },
    active: {
        type : Boolean,
        default : true
    }
});

module.exports = new mongoose.model('brand',brandSchema);