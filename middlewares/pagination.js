const productCollection = require('../model/productSchema');

module.exports = {
    pagination : async(req,res,next)=>{
        try {
            const currentPage = parseInt(req.query.page) || 1;
            console.log("currentPage: ",currentPage);
            const limit = 6 ; //items per page
            let totalProductsCount = 0;
            if(res.locals.filteredProducts){
                console.log("filteredProducts:",res.locals.filteredProducts);
                totalProductsCount = res.locals.filteredProducts.length;
                req.filteredProducts = res.locals.filteredProducts;
            }else{
                totalProductsCount = await productCollection.countDocuments();
            }
            
            console.log("totalProducts: ",totalProductsCount);
            const totalPages = Math.ceil(totalProductsCount/limit);
            console.log("total pages: ",totalPages);
            const previousPage = currentPage>1 ? currentPage-1 : null;
            console.log("previous page: ",previousPage);
            const nextPage = currentPage<totalPages ? currentPage+1 : null;
            console.log("next page: ",nextPage);
            const paginationData = {previousPage:previousPage,nextPage:nextPage,currentPage:currentPage,limit:limit,totalPages:totalPages,totalProductsCount:totalProductsCount};
            req.paginationData = paginationData;
            next();
        } catch (error) {
            console.log("error while pagination: ",error.message);
        }
    }
}