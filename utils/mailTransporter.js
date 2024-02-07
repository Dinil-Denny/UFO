const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    auth : {
        user: process.env.AUTH_MAIL,
        pass: process.env.AUTH_PASS
    }
})

module.exports = transporter;