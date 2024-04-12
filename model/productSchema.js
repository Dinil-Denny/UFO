const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    productName:{
        type: String,
        required: true
    },
    description:{
        type: String,
        required: true
    },
    category:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category'
    },
    price:{
        type: Number,
        required: true
    },
    offerPrice:{
        type: Number,
        require: true
    },
    gender:{
        type: String,
        required: true
    },
    brandName:{
        type: mongoose.Schema.Types.ObjectId,
        ref : 'brand',
        required: true
    },
    size:{
        type:String,
        required:true
    },
    color:{
        type:String,
        required:true
    },
    stock:{
        type:Number,
        required:true,
        default:0
    },
    images:{
        type:[String],
        required: true,
    },
    active:{
        type: Boolean,
        default: true
    },
})

module.exports = mongoose.model('products',productSchema);