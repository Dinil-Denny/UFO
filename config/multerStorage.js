const multer = require('multer');

// configuring multer storage 
const storage = multer.diskStorage({
    destination: (req,file,cb)=>{
        console.log("1")
        cb(null, 'public/images/imgUploads');
        console.log("destination secured");
    },
    filename: (req,file,cb)=>{
        console.log("2.1")
        const uniqueSuffix = Date.now()+'-'+Math.round(Math.random() * 1e9);
        console.log("2.2")
        const filename = `${uniqueSuffix}-${file.originalname}`;
        console.log("2.3")
        cb(null, filename);
        console.log("filename done");
    }
})

const upload = multer({storage}); 
 
module.exports = {upload};