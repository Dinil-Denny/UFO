const userCollection = require('../model/userSchema');

module.exports = {
    // authentication middleware
    userAuthentication : async(req,res,next)=>{
        try {
            if(req.session && req.session.userid){
                console.log("req.session.userid: ",req.session.userid);
                const user = await userCollection.findOne({email : req.session.userid});
                console.log("User in auth middleware: ",user);
                    if(!user || user.blocked){
                        req.session.destroy((err)=>{
                            if(err){
                                console.log("Error in destroying session: ",err);
                            }
                            return res.redirect('/login');
                        });
                    }else{
                        next();
                    }
                }
            else{
                res.redirect('/login');
            }
        } catch (error) {
            console.log("Error!!: ",error);
        }
    },
    preventBackToLogin : async(req,res,next)=>{
        try {
            console.log(`req.session.userid: ${req.session.userid}, req.session: ${req.session}`);
            if(req.session && req.session.userid && req.originalUrl === '/login'){
                    return res.redirect('/');
            }
            next();
        } catch (error) {
            console.log("An error occured: ",error.message);
        }
    }
}