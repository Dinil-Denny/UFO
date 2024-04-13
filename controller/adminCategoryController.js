const mongoose = require('mongoose');
const categoryCollection = require('../model/categorySchema');

module.exports = {
    getAddCatagory: async(req,res)=>{
        try{
            const categoryList = await categoryCollection.find({}).lean();
            res.render('admin/addCategory',{categoryList,admin:true,adminName:req.session.admin,title:"Category"});
        }catch(err){
            console.log(`Error occured!! : ${err.message}`);
        }
    },
    postAddCatagory: async(req,res)=>{
        try{
            const {catagoryName,description} = req.body;
            // const categoryExists = await categoryCollection.findOne({catagoryName});
             const categoryExists = await categoryCollection.findOne({
                catagoryName:{$regex:new RegExp("^"+catagoryName+"$","i")}
            });
            if(!categoryExists){
                const categoryData = {
                    catagoryName,
                    description
                }
                await categoryCollection.insertMany([categoryData]);
                res.redirect('/admin/category');
            }
            const categoryList = await categoryCollection.find({}).lean();
            res.render('admin/addCategory',{admin:true, adminName:req.session.admin, message:"Category already exists!", title:"Category",categoryList});
        }catch(err){
            console.log(`An error occured: ${err.message}`);
        }
    },
    deleteCategory:async(req,res)=>{
        try {
            await categoryCollection.findByIdAndDelete(req.params.id);
            res.redirect('/admin/category');
        } catch (error) {
            console.log(`An error occured: ${err.message}`);
        }      
    },
    getEditCategory: async(req,res)=>{
        try {
            const category = await categoryCollection.findById(req.params.id).lean();
                
            res.render('admin/editCategory',{admin:true,adminName:req.session.admin,title:"Edit Category",category});
        } catch (error) {
            console.log("Error !: ",error);
        }
    },
    postEditCategory: async(req,res)=>{
        try{
            const {catagoryName,description} = req.body;
            const category = await categoryCollection.findById(req.params.id).lean();
            const categoryIdToExclude = new mongoose.Types.ObjectId(req.params.id);
            const categoryExist = await categoryCollection.findOne({
                catagoryName:{$regex:new RegExp("^"+catagoryName+"$","i")},
                _id:{$ne:categoryIdToExclude}
            });
                
                
            if(!categoryExist){
                await categoryCollection.findByIdAndUpdate(req.params.id,{catagoryName,description});
                res.redirect('/admin/category');  
            }
            res.render('admin/editCategory',{admin:true,adminName:req.session.admin,title:"Edit Category",message:"Category name already exists.",category});
                
        }catch(err){
            console.log(`An error occured:- ${err}`);   
        }
    },
}