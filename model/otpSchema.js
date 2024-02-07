const mongoose = require('mongoose');
let otpSchema = new mongoose.Schema({
    userId : {
        type: String
    },
    otp : String,
    createdAt : Date,
    expiresAt : Date
});

const otpCollection = new mongoose.model('otp',otpSchema);
module.exports = otpCollection;