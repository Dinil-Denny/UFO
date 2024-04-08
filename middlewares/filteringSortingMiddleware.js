const productCollection = require('../model/productSchema');

module.exports = {
    filterSorting : async(req,res,next)=>{
        try{
            const filters = req.query;
            console.log("filters: ",filters);
            let query = {};

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

            console.log("query: ",query);
            
            if(filters.sort){
                const filteredProducts = await productCollection.find(query).populate('category').populate('brandName').sort({offerPrice:Number(filters.sort)}).lean();
                //const data = {filteredProducts:filteredProducts,previousPage:previousPage,nextPage:nextPage,currentPage:currentPage}
                //res.send(filteredProducs);
                console.log("filteredProducts:",filteredProducts);
                res.locals.filteredProducts = filteredProducts;
                next();
            }else{
                const filteredProducts = await productCollection.find(query).populate('category').populate('brandName').lean();
                //const data = {filteredProducts:filteredProducts,previousPage:previousPage,nextPage:nextPage,currentPage:currentPage}
                //res.send(filteredProducs);
                console.log("filteredProducts:",filteredProducts);
                res.locals.filteredProducts = filteredProducts;
                next();
            }
        }catch(err){
            console.log("Error while filtering&sorting: ",err.message);
        }
    },

}