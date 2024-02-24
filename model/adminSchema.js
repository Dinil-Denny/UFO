const mongoose = require('mongoose');
let adminSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email : {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
})

let adminCollection = new mongoose.model('admin',adminSchema);
module.exports = adminCollection;
