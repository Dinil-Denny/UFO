const userCollection = require('../../model/userSchema');

module.exports = {
    getUserList : async(req,res,next)=>{
        try {
            const userList = await userCollection.find({}).sort({createdAt:-1}).lean();
            res.render('admin/adminCustomers',{admin:true, userList, adminName:req.session.admin,title:"User_List"});          
        } catch (error) {
            console.log("Error: ",error);
            res.render('admin/adminError',{title:"Error",admin:true,adminName:req.session.admin});
        }
    },
    blockUser : async(req,res,next)=>{
        try {
            const id= req.params.id;
            const user = await userCollection.findById(req.params.id);
            if(!user.blocked){
                await userCollection.findByIdAndUpdate(req.params.id, {blocked:true});
                res.redirect('/admin/customers');
            }
            if(user.blocked){
                await userCollection.findByIdAndUpdate(req.params.id, {blocked:false});
                res.redirect('/admin/customers');
            } 
        } catch (error) {
            console.log("Error! : ",err);
            res.render('admin/adminError',{title:"Error",admin:true,adminName:req.session.admin});
        }
    },
}