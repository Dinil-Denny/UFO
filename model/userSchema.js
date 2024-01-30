const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name:{
        type : String,
        require : true
    },
    email:{
        type: String,
        require : true,
        unique : true
    },
    mobile:{
        type: Number,
        require: true
    },
    password:{
        type: String,
        require: true
    }
})

const userCollection = new mongoose.model("users",userSchema);
module.exports = userCollection;