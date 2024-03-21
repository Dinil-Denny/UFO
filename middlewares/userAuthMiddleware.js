const userCollection = require('../model/userSchema');

module.exports = {
    // authentication middleware
    userAuthentication : async(req,res,next)=>{
        try {
            if(req.session && req.session.userid){
                const user = await userCollection.findOne({email : req.session.userid});
                    if(!user || user.blocked){
                        req.sessionStore.destroy(req.session.userid,(err)=>{
                            if(err){
                                console.log("Error in destroying user session: ",err);
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
    preventUserBackToLogin : async(req,res,next)=>{
        try {
            if(req.session && req.session.userid && req.originalUrl === '/login'){
                    return res.redirect('/');
            }
            next();
        } catch (error) {
            console.log("An error occured: ",error.message);
        }
    }
}