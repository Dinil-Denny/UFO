const adminCollection = require('../model/adminSchema');

module.exports = {
    adminAuthentication : async(req,res,next)=>{
        try {
            if(req.session && req.session.adminid){
                const admin = await adminCollection.findOne({email: req.session.adminid});
                if(!admin){
                    req.sessionStore.destroy(req.session.adminid,(err)=>{
                        if(err) console.log("Error while destroying admin session: ",err);
                        else redirect('/admin/login');
                    })
                }else{
                    next();
                }
            }
            else{
                res.redirect('/admin/login');
            }
        } catch (error) {
            console.log("Error: ",error.message);
        }
    }
}