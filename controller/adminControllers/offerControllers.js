const mongoose = require('mongoose');
const offerCollection = require('../../model/offerSchema');
const categoryCollection = require('../../model/categorySchema');

module.exports = {
    getOfferList : async(req,res)=>{
        try {
            const offers = await offerCollection.find({}).populate('categoryName').lean();
            const formattedDateOffers = offers.map(offer => {
                const date = offer.offerExpiryDate;
                const formattedDate = date.toLocaleDateString();
                return {...offer, offerExpiryDate:formattedDate}
            });
            res.render('admin/offers',{admin:true,adminName:req.session.admin,title:"Offer",formattedDateOffers})
        } catch (err) {
            console.log("Error while getting offer list:",err.message);
            res.render('admin/adminError',{title:"Error",admin:true,adminName:req.session.admin});
        }
    },
    getAddOffer : async(req,res)=>{
        try {
            const categories = await categoryCollection.find().lean();
            res.render('admin/addOffer',{admin:true,adminName:req.session.admin,title:"Add offer",categories});
        } catch (err) {
            console.log("Error while getting add offer:",err.message);
            res.render('admin/adminError',{title:"Error",admin:true,adminName:req.session.admin});
        }
    },
    postAddOffer : async(req,res)=>{
        try {
            const {categoryName,offerPercentage,offerExpiryDate} = req.body;
            const newCategoryOffer = new offerCollection({
                categoryName,
                offerPercentage,
                offerExpiryDate
            })
            await newCategoryOffer.save();
            res.redirect('/admin/offers');
        } catch (err) {
            console.log("Error while adding offer:",err.message);
            res.render('admin/adminError',{title:"Error",admin:true,adminName:req.session.admin});
        }
    },
    getEditOffer : async(req,res)=>{
        try {
            const offerId = req.params.id;
            const categories = await categoryCollection.find().lean();
            const offer = await offerCollection.findOne({_id:new mongoose.Types.ObjectId(offerId)}).populate('categoryName').lean();    
            const modifiedDateFormat = new Date(offer.offerExpiryDate).toISOString().slice(0, 10);
            res.render('admin/editOffer',{admin:true,title:"Edit offer",adminName:req.session.admin,categories,modifiedDateFormat,offer});
        } catch (err) {
            console.log("Error in getting EditOffer:",err.message);
            res.render('admin/adminError',{title:"Error",admin:true,adminName:req.session.admin});
        }
    },
    postEditOffer : async(req,res)=>{
        try {
            const offerId = req.params.id;
            const {categoryName,offerPercentage,offerExpiryDate} = req.body;
            await offerCollection.findOneAndUpdate({_id:new mongoose.Types.ObjectId(offerId)},{$set:{categoryName:categoryName,offerPercentage:offerPercentage,offerExpiryDate:offerExpiryDate}});
            res.redirect('/admin/offers');
        } catch (err) {
            console.log("Error while editing offer:",err.message);
            res.render('admin/adminError',{title:"Error",admin:true,adminName:req.session.admin});
        }
    },
    deleteOffer : async(req,res)=>{
        try {
            const offerId = req.params.id;
            await offerCollection.findOneAndDelete({_id:new mongoose.Types.ObjectId(offerId)});
            res.redirect('/admin/offers')
        } catch (err) {
            console.log("Error while deleting offer:",err.message);
            res.render('admin/adminError',{title:"Error",admin:true,adminName:req.session.admin});
        }
    },
    offerStatusUpdate : async(req,res)=>{
        try {
            const {offerId} = req.body;
            const offer = await offerCollection.findOne({_id: offerId});
            if(offer.isActive){
                await offerCollection.findOneAndUpdate({_id:offerId},{$set:{isActive:false}});
                return res.status(200).json({isActive:false});
            }else{
                await offerCollection.findOneAndUpdate({_id:offerId},{$set:{isActive:true}});
                return res.status(200).json({isActive:true});
            }
        } catch (err) {
            console.log("Error while updating status:",err.message);
            res.render('admin/adminError',{title:"Error",admin:true,adminName:req.session.admin});
        }
    }
}