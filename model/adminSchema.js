const mongoose = require('mongoose');
let adminSchema = new mongoose.Schema({
    name: {
        type: String,
        require: true
    },
    email : {
        type: String,
        require: true
    },
    password: {
        type: String,
        require: true
    }
})

let adminCollection = new mongoose.model('admin',adminSchema);
module.exports = adminCollection;
