const multer = require('multer');

// configuring multer storage 
const storage = multer.diskStorage({
    destination: (req,file,cb)=>{
        cb(null, 'public/images/imgUploads');
    },
    filename: (req,file,cb)=>{
        const uniqueSuffix = Date.now()+'-'+Math.round(Math.random() * 1e9);
        const filename = `${uniqueSuffix}-${file.originalname}`;
        cb(null, filename);
    }
})

const upload = multer({storage:storage}); 
 
module.exports = {upload};