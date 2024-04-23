const couponCollection = require('../../model/couponSchema');
const mongoose = require('mongoose');

module.exports = {
    getCouponList : async(req,res)=>{
        try{
            const paginationData = req.paginationData;
            const previousPage = paginationData.previousPage;
            const nextPage = paginationData.nextPage;
            const currentPage = paginationData.currentPage;
            const limit = paginationData.limit;

            const coupons = await couponCollection.find().sort({createdAt:-1}).skip((currentPage-1) * limit).limit(limit).lean();
            console.log("coupons:",coupons);
            const dateModifiedCoupons = coupons.map((coupon)=>{
                const expriyDate = coupon.expiryAt;
                const formattedDate = expriyDate.toLocaleDateString();
                const formattedTime = expriyDate.toLocaleTimeString();
                const formattedDateAndTime = `${formattedDate} ${formattedTime}`;
                return {...coupon, expiryAt:formattedDateAndTime};
            });
            console.log("dateModifiedCoupons:",dateModifiedCoupons);
            res.render('admin/couponListing',{dateModifiedCoupons,admin:true,adminName:req.session.admin,title:"Coupons",previousPage,currentPage,nextPage});
        }catch(err){
            console.log("Error while getting coupons list: ",err.message);
        }
    },
    getAddCoupon : async(req,res)=>{
        try{
            res.render('admin/addCoupon',{title:"Add coupon",admin:true,adminName: req.session.admin});
        }catch(err){
            console.log("Error while getting Add coupon",err.message);
        }
    },
    postAddCoupon : async(req,res)=>{
        console.log(req.body);
        const {couponCode,discount,minimumSpend,expiryAt} = req.body;
        try{
            const couponExist = await couponCollection.findOne({couponCode:{$regex: new RegExp("^"+couponCode+"$","i")}});
            if(couponExist){
                return res.render('admin/addCoupon',{title:"Add coupon",admin:true,adminName: req.session.admin,ErrMessage:"Coupon already exist. Try adding another coupon"})
            }
            const newCoupon = new couponCollection({
                couponCode,
                discount,
                minimumSpend,
                expiryAt
            });
            await newCoupon.save();
            res.redirect('/admin/coupons');
        }catch(err){
            console.log("Error while adding coupon",err.message);
        }
    },
    getEditCoupon : async(req,res)=>{
        try {
            const couponId = new mongoose.Types.ObjectId(req.params.id);
            const coupon = await couponCollection.findOne({_id:couponId}).lean();
            const modifiedDateFormat = new Date(coupon.expiryAt).toISOString().slice(0, 10);
            res.render('admin/editCoupon',{admin:true,title:"Edit Coupon",coupon,modifiedDateFormat});
        } catch (err) {
            console.log("Error while getting edit coupon:",err.message);
        }
    },
    postEditCoupon : async(req,res)=>{
        try {
            const{couponCode,discount,minimumSpend,expiryAt} = req.body;
            console.log(req.body);
            const couponId = new mongoose.Types.ObjectId(req.params.id);
            console.log(req.params.id);
            const couponExist = await couponCollection.findOne({couponCode:{$regex: new RegExp("^"+couponCode+"$","i")},_id:{$ne:couponId}});
            if(couponExist){
                const coupon = await couponCollection.findOne({_id:couponId}).lean();
                const modifiedDateFormat = new Date(coupon.expiryAt).toISOString().slice(0, 10);
                return res.render('admin/editCoupon',{admin:true,title:"Edit Coupon",coupon,modifiedDateFormat,errorMessage:"Coupon already exist!"});
            }
            await couponCollection.findOneAndUpdate({_id:couponId},{$set:{couponCode:couponCode,discount:discount,minimumSpend:minimumSpend,expiryAt:expiryAt}});
            res.redirect('/admin/coupons');
        } catch (err) {
            console.log("Error while editing coupon: ",err.message);
        }
    },
    couponStatusUpdate : async(req,res)=>{
        try{
            const {couponId} = req.body;
            const coupon = await couponCollection.findOne({_id:new mongoose.Types.ObjectId(couponId)});
            if(coupon.isActive){
                await couponCollection.findOneAndUpdate({_id:new mongoose.Types.ObjectId(couponId)},{$set:{isActive:false}});
                return res.status(200).json({isActive:false});
            }else{
                await couponCollection.findOneAndUpdate({_id:new mongoose.Types.ObjectId(couponId)},{$set:{isActive:true}});
                return res.status(200).json({isActive:true});
            }
        }catch(err){
            console.log("Error while coupon status update:",err.message);
        }
    },
    deleteCoupon : async(req,res)=>{
        try {
            const id = req.params.id;
            await couponCollection.findOneAndDelete({_id:new mongoose.Types.ObjectId(id)});
            res.redirect('/admin/coupons');
        } catch (err) {
            console.log("Error while deleting the product:",err.message);
        }
    }
}