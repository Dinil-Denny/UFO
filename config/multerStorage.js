const multer = require('multer');
const sharp = require('sharp');

// configuring multer storage 
const storage = multer.diskStorage({
    destination: (req,file,cb)=>{
        console.log("storage action");
        cb(null, 'public/images/imgUploads');
        console.log("destination secured");
    },
    filename: (req,file,cb)=>{
        console.log("Uploading file: ",file.originalname);
        const uniqueSuffix = Date.now()+'-'+Math.round(Math.random() * 1e9);
        console.log("uniqueSuffix: ",uniqueSuffix);
        const filename = `${uniqueSuffix}-${file.originalname}`;
        console.log("filename: ",filename);
        cb(null, filename);
        console.log("filename done");
    }
})

const upload = multer({storage:storage}); 
 
module.exports = {upload};