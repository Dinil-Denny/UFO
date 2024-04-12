const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
    user : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'users',
        required : true
    },
    products : [{
        productId : {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'products',
            required: true
        },
        dateCreated: {
            type : String,
            default : () => new Date()
        }    
    }],
    
})

module.exports = mongoose.model('wishlist',wishlistSchema);