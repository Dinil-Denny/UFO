const mongoose = require('mongoose');
require('dotenv').config();

// db connecting
// let url = "mongodb://127.0.0.1:27017/UFOdb";
mongoose.connect(process.env.MONGODB_URI)
.then(()=>console.log("DB connected"))
.catch((err) => console.error("Error in connecting to DB"+err))
