const mongoose = require('mongoose');
require('dotenv').config();

// db connecting
mongoose.connect(process.env.MONGODB_URI)
.then(()=>console.log("DB connected"))
.catch((err) => console.error("Error in connecting to DB"+err))
