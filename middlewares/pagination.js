const productCollection = require('../model/productSchema');

module.exports = {
    pagination : async(req,res,next)=>{
        try {
            const currentPage = parseInt(req.query.page) || 1;
            const limit = 6; //items per page
            let totalProductsCount = 0;
            if(res.locals.filteredProducts){
                totalProductsCount = res.locals.filteredProducts.length;
                req.filteredProducts = res.locals.filteredProducts;
            }else{
                totalProductsCount = await productCollection.countDocuments();
            }
            const totalPages = Math.ceil(totalProductsCount/limit);
            const previousPage = currentPage>1 ? currentPage-1 : null;
            const nextPage = currentPage<totalPages ? currentPage+1 : null;
            const paginationData = {previousPage:previousPage,nextPage:nextPage,currentPage:currentPage,limit:limit,totalPages:totalPages,totalProductsCount:totalProductsCount};
            req.paginationData = paginationData;
            next();
        } catch (error) {
            console.log("error while pagination: ",error.message);
        }
    }
}