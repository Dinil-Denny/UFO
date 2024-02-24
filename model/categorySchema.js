const mongoose = require('mongoose');
let categorySchema = new mongoose.Schema({
    catagoryName: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type:String,
    },
    
})

const categoryCollection = new mongoose.model('category',categorySchema);
module.exports = categoryCollection;