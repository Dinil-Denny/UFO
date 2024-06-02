const orderCollection = require('../../model/orderSchema');
const userCollection = require('../../model/userSchema');

module.exports = {
    getDashboard : async(req,res,next)=>{
        let session = req.session;
        try{
            if(session.adminid){
                const orders = await orderCollection.find();
                const totalOrders = orders.length;
                const customers = await userCollection.find();
                const totalCustomers = customers.length;
                const totalRevenue = orders.reduce((acc,curr)=>acc+curr.totalPrice,0).toFixed(2);
                res.render('admin/adminDashboard',{admin:true, adminName:req.session.admin,title:"Admin_Dashboard",totalOrders,totalCustomers,totalRevenue});
            }else{
                res.render('admin/adminLogin',{admin:true,title:"Admin_Login"});
            }
        }catch(err){
            console.log("Error !! "+err);
            res.render('admin/adminError',{title:"Error",admin:true,adminName:req.session.admin});
        } 
    },
    topSellingProducts : async(req,res)=>{
        try {
            const topSellingProducts = await orderCollection.aggregate([
                {
                    $unwind:"$productsData"
                },
                {
                    $group:{_id:'$productsData.productId',quantityOrdered:{$sum:'$productsData.quantity'}}
                },
                {
                    $sort:{quantityOrdered:-1}
                },
                {
                    $lookup:{
                        from:"products",
                        localField:"_id",
                        foreignField:"_id",
                        as:"orderedProducts"
                    }
                },
                {
                    $project:{productName:"$orderedProducts.productName",description:"$orderedProducts.description",quantityOrdered:1}
                },
                {
                    $limit:10
                }
            ]);
            res.render('admin/topTenProducts',{title:"Top selling 10 products",admin:true,adminName:req.session.admin,topSellingProducts})
        } catch (err) {
            console.log("Error while getting top selling products:",err.message);
            res.render('admin/adminError',{title:"Error",admin:true,adminName:req.session.admin});
        }
    },
    topSellingCategorys : async(req,res)=>{
        try {
            const topSellingCategory = await orderCollection.aggregate([
                {
                    $unwind:"$productsData"
                },
                {
                    $lookup:{
                        from:"products",
                        localField:"productsData.productId",
                        foreignField:"_id",
                        as:"orderedProducts"
                    }
                },
                {
                    $group:{_id:"$orderedProducts.category",quantityOrdered:{$sum:'$productsData.quantity'}}
                },
                {
                    $lookup:{
                        from:"categories",
                        localField:"_id",
                        foreignField:"_id",
                        as:"productCategory"
                    }
                },
                {
                    $sort:{quantityOrdered:-1}
                },
                {
                    $project:{categoryName:"$productCategory.catagoryName",description:"$productCategory.description",quantityOrdered:1}
                },
                {
                    $limit:10
                }
            ])
            res.render('admin/topTenCategory',{title:"Top selling 10 category",admin:true,adminName:req.session.admin,topSellingCategory})
        } catch (err) {
            console.log("Error while getting topSellingCategory:",err.message);
            res.render('admin/adminError',{title:"Error",admin:true,adminName:req.session.admin});
        }
    },
    topSellingBrands : async(req,res)=>{
        try {
            const topSellingBrands = await orderCollection.aggregate([
                {
                    $unwind:"$productsData"
                },
                {
                    $lookup:{
                        from:"products",
                        localField:"productsData.productId",
                        foreignField:"_id",
                        as:"orderedProducts"
                    }
                },
                {
                    $group:{_id:"$orderedProducts.brandName",quantityOrdered:{$sum:'$productsData.quantity'}}
                },
                {
                    $lookup:{
                        from:"brands",
                        localField:"_id",
                        foreignField:"_id",
                        as:"productBrand"
                    }
                },
                {
                    $sort:{quantityOrdered:-1}
                },
                {
                    $project:{brandName:"$productBrand.brandName",quantityOrdered:1}
                },
                {
                    $limit:10
                }
            ]);
            res.render('admin/topTenBrands',{admin:true,title:"Top selling 10 bramds",adminName:req.session.admin,topSellingBrands})
        } catch (err) {
            console.log("Error while getting topSellingBrands:",err.message);
            res.render('admin/adminError',{title:"Error",admin:true,adminName:req.session.admin});
        }
    },
    getPeriodicChartData : async(req,res)=>{
        try {
            const {groupBy} = req.query;
            let pipeline = null;
            if(groupBy === 'weekly'){
                pipeline = [
                    {
                      $group: {
                        _id: {
                            week: { $week: '$date' },
                            month: { $month: '$date' }, 
                            year: { $year: '$date' },
                        },
                        totalSales: { $sum: '$totalPrice' },
                        totalOrders: { $sum: 1 },
                        totalCouponDiscount: { $sum: { $cond: [{ $eq: ['$couponDiscount', null] }, 0, '$couponDiscount'] } }, // Assuming all orders have couponDiscount
                        totalMRPDiscount:{$sum: '$productPriceDiscount'}
                      },
                    },
                ];
                const periodwiseSalesData = await orderCollection.aggregate(pipeline).sort({_id:1});
                const data = {periodwiseSalesData:periodwiseSalesData, period:"weekly"}
                res.json(data);
            }else if(groupBy === 'monthly'){
                pipeline = [
                    {
                      $group: {
                        _id: {
                            month: { $month: '$date' },
                            year: { $year: '$date' },
                        },
                        totalSales: { $sum: '$totalPrice' },
                        totalOrders: { $sum: 1 },
                        totalCouponDiscount: { $sum: { $cond: [{ $eq: ['$couponDiscount', null] }, 0, '$couponDiscount'] } }, // Assuming all orders have couponDiscount
                        totalMRPDiscount:{$sum: '$productPriceDiscount'}
                      },
                    },
                ];
                const periodwiseSalesData = await orderCollection.aggregate(pipeline).sort({_id:1});
                const data = {periodwiseSalesData:periodwiseSalesData, period:"monthly"}
                res.json(data);
            }else if(groupBy === 'yearly'){
                pipeline = [
                    {
                      $group: {
                        _id: {
                          year: { $year: '$date' },
                        },
                        totalSales: { $sum: '$totalPrice' },
                        totalOrders: { $sum: 1 },
                        totalCouponDiscount: { $sum: { $cond: [{ $eq: ['$couponDiscount', null] }, 0, '$couponDiscount'] } }, // Assuming all orders have couponDiscount
                        totalMRPDiscount:{$sum: '$productPriceDiscount'}
                      },
                    },
                ];
                const periodwiseSalesData = await orderCollection.aggregate(pipeline).sort({_id:1});
                const data = {periodwiseSalesData:periodwiseSalesData, period:"yearly"}
                res.json(data);
            }else if(groupBy === 'daily'){
              pipeline = [
                {
                  $group: {
                    _id: { date:'$date'
                    },
                    totalSales: { $sum: '$totalPrice' },
                    totalOrders: { $sum: 1 },
                    totalCouponDiscount: { $sum: { $cond: [{ $eq: ['$couponDiscount', null] }, 0, '$couponDiscount'] } }, // Assuming all orders have couponDiscount
                    totalMRPDiscount:{$sum: '$productPriceDiscount'}
                  },
                },
              ];
              const periodwiseSalesData = await orderCollection.aggregate(pipeline).sort({_id:1});
              const formattedDatePeriodwiseSalesData = periodwiseSalesData.map(order => {
                const formattedDate = order._id.date.toLocaleDateString();
                return {...order,_id:formattedDate}
              });
              const data = {periodwiseSalesData:formattedDatePeriodwiseSalesData, period:"daily"}
              res.json(data);
            }
        } catch (err) {
            console.log("Error while getting chart data:",err.message);
            res.render('admin/adminError',{title:"Error",admin:true,adminName:req.session.admin});
        }
    },
    getDaywiseSalesData : async(req,res)=>{
        try{
            const date = req.query.date;
            const isoDate = new Date(date);
            const salesData = await orderCollection.aggregate([
                { $match: { date: { $eq: isoDate } } }, // Match by date
                {
                  $group: {
                    _id: isoDate.toLocaleDateString(),
                    totalSales: { $sum: '$totalPrice'}
                  },
                },
            ]);
            res.json(salesData);
        }catch(err){
            console.log("Error while getting day wise data:",err.message);
            res.render('admin/adminError',{title:"Error",admin:true,adminName:req.session.admin});
        }
    },
    getDailySalesData: async(req,res)=>{
        try {
            let pipeline = [
                {
                  $group: {
                    _id: { date: '$date'
                    },
                    totalSales: { $sum: '$totalPrice' },
                    totalOrders: { $sum: 1 },
                    totalCouponDiscount: { $sum: { $cond: [{ $eq: ['$couponDiscount', null] }, 0, '$couponDiscount'] } }, // Assuming all orders have couponDiscount
                    totalMRPDiscount:{$sum: '$productPriceDiscount'}
                  },
                },
              ];
  
              const dailySalesData = await orderCollection.aggregate(pipeline).sort({_id:1});
              const dateFormattedDailyData = dailySalesData.map(dateValue => {
                const formattedDate = dateValue._id.date.toLocaleDateString();
                return {...dateValue,_id:formattedDate}
              })
              res.json(dateFormattedDailyData);
        } catch (err) {
            console.log("Error while getting daily sales data:",err.message);
            res.render('admin/adminError',{title:"Error",admin:true,adminName:req.session.admin});
        }
    }
}