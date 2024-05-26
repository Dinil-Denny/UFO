const productCollection = require('../model/productSchema');
const categoryCollection = require('../model/categorySchema');
const brandCollection = require('../model/brandSchema');

module.exports = {
    filterSorting : async(req,res,next)=>{
        try{
            const filters = req.query;
            let query = {};
            if(filters.search){
                const category = await categoryCollection.findOne({catagoryName:{$regex : filters.search, $options:'i'}});
                const brand = await brandCollection.findOne({brandName:{$regex: filters.search,$options:'i'}});
                if(category){
                    query = {
                        $or:[
                        {productName: {$regex: filters.search,$options: 'i'}},
                        {description: {$regex: filters.search,$options: 'i'}},
                        {category: category._id},
                        {gender: {$regex: filters.search,$options: 'i'}},
                        {color: {$regex: filters.search,$options: 'i'}}
                        ]
                    }
                }else if(brand){
                    query = {
                    $or:[
                        {productName: {$regex: filters.search,$options: 'i'}},
                        {description: {$regex: filters.search,$options: 'i'}},
                        {gender: {$regex: filters.search,$options: 'i'}},
                        {color: {$regex: filters.search,$options: 'i'}},
                        {brandName: brand._id}
                    ]
                    }
                }else{
                    query = {
                    $or:[
                        {productName: {$regex: filters.search,$options: 'i'}},
                        {description: {$regex: filters.search,$options: 'i'}},
                        {gender: {$regex: filters.search,$options: 'i'}},
                        {color: {$regex: filters.search,$options: 'i'}}
                    ]
                    }
                }
            }

            // filter based on gender
            if(Array.isArray(filters.gender)){
                query.gender = {$in : filters.gender};
            }else if(filters.gender){
                query.gender = filters.gender;
            }

            // filter based on brand name
            if(Array.isArray(filters.brand)){
                query.brandName = {$in : filters.brand};
            }else if(filters.brand){
                query.brandName = filters.brand;
            }
            
            //filter based on category
            if(Array.isArray(filters.category)){
                query.category = {$in:filters.category}
            }else if(filters.category){
                query.category = filters.category;
            }

            // filter on price
            if(Array.isArray(filters.offerPrice)){
                const parsedPriceFilter = filters.offerPrice.map(value => parseInt(value));
                query.offerPrice = {$gte: Math.min(...parsedPriceFilter),$lte:Math.max(...parsedPriceFilter)+500}
            }else if(filters.offerPrice){
                if(filters.offerPrice === '3000') 
                    query.offerPrice = {$gte:Number(filters.offerPrice)}
                else
                    query.offerPrice = {$gte:Number(filters.offerPrice),$lte:Number(filters.offerPrice)+500}
            }

            //pagination 
            const limit = 6;
            const totalProducts = await productCollection.find(query).countDocuments();
            const totalPages = Math.ceil(totalProducts/limit);
            const currentPage = parseInt(req.query.page) || 1;
            const previousPage = currentPage>1 ? parseInt(currentPage)-1 : null;
            const nextPage = currentPage<totalPages ? parseInt(currentPage)+1 : null;
            if(filters.sort){
                const filteredProducts = await productCollection.find(query).populate('category').populate('brandName').sort({offerPrice:Number(filters.sort)}).skip((currentPage-1) * limit).limit(limit).lean();             
                const data = {filteredProducts,currentPage,previousPage,nextPage};
                req.data = data;
                next();
            }else{
                const filteredProducts = await productCollection.find(query).populate('category').populate('brandName').skip((currentPage-1) * limit).limit(limit).lean();
                const data = {filteredProducts,currentPage,previousPage,nextPage};
                req.data = data;
                next();
            }
        }catch(err){
            console.log("Error while filtering&sorting: ",err.message);
        }
    },

}