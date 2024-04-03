const userCollection = require('../model/userSchema');

module.exports = {
    // authentication middleware
    userAuthentication : async(req,res,next)=>{
        try {
            if(req.session && req.session.userid){
                const user = await userCollection.findOne({email : req.session.userid});
                    if(!user){
                        req.sessionStore.destroy(req.session.userid,(err)=>{
                            if(err){
                                console.log("Error in destroying user session: ",err);
                            }
                            return res.render('user/userLogin',{title:"Login"});
                        });
                    }
                    else if(user.blocked){
                        req.sessionStore.destroy(req.session.userid,(err)=>{
                            if(err){
                                console.log("Error in destroying user session: ",err);
                            }
                            return res.render('user/userLogin',{title:"Login",message:"Your account is blocked"});
                        });
                    }
                    else{
                        next();
                    }
                }
            else{
                return res.redirect('/login');
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
    },
    userBlocked: async(req,res)=>{
        try {
            
        } catch (error) {
            console.log("Error in blocking user!!! ",error)
        }
    }
}