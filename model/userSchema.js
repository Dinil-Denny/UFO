const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name:{
        type : String,
        required : true
    },
    email:{
        type: String,
        required : true, 
        unique : true
    },
    mobilenumber:{
        type: Number,
        required: true
    },
    password:{
        type: String,
        required: true
    },
    createdAt:{
        type: Date,
    },
    blocked:{
        type : Boolean,
        default : false
    }
})

const userCollection = new mongoose.model("users",userSchema);
module.exports = userCollection;