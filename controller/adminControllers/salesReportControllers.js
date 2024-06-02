const orderCollection = require('../../model/orderSchema');
const exceljs = require('exceljs');

module.exports = {
    getSalesData : async(req,res)=>{
        try {
            const orders = await orderCollection.find().populate('productsData.productId').lean();
            const totalNumberOfOrders = orders.length;
            const totalRevenue = orders.reduce((acc,curr)=>acc+curr.totalPrice ,0).toFixed(2);
            const overallCouponDiscount = orders.reduce((acc,curr)=>acc+curr.couponDiscount,0).toFixed(2);
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
              return {...dateValue,date:formattedDate}
            });
            
            res.render('admin/adminSalesReport',{admin:true,
                title:"Sales Report",
                adminName:req.session.admin,
                totalNumberOfOrders,
                totalRevenue,
                overallCouponDiscount,
                dateFormattedDailyData
            })
        } catch (err) {
            console.log("Error while getting sales data: ",err.message);
            res.render('admin/adminError',{title:"Error",admin:true,adminName:req.session.admin});
        }
    },

    getCustomDateSalesData : async(req,res)=>{
      try {
        const {fromDate,toDate} = req.query;
        const isoFromDate = new Date(fromDate);
        const isoToDate = new Date(toDate);
        if(isoFromDate<Date.now() && isoToDate<=Date.now() && isoFromDate<isoToDate){
          const customDateSalesReport = await orderCollection.aggregate([
            {$match:{date:{$gte:isoFromDate,$lte:isoToDate}}},
            {$group:{
              _id:{
                day: { $dayOfMonth: '$date' },
                month: { $month: '$date' }, 
                year: { $year: '$date' },
              },
              totalSales: { $sum: '$totalPrice' },
              totalOrders: { $sum: 1 },
              totalCouponDiscount: { $sum: { $cond: [{ $eq: ['$couponDiscount', null] }, 0, '$couponDiscount'] } }, // Assuming all orders have couponDiscount
              totalMRPDiscount:{$sum: '$productPriceDiscount'}
            }}
          ]);
          return res.json(customDateSalesReport);
        }else{
          return res.json({errorMessage:"Select correct date values"});
        }
      } catch (err) {
        console.log("Error while getting CutomDateSalesData:",err.message);
        res.render('admin/adminError',{title:"Error",admin:true,adminName:req.session.admin});
      }
    },

    getDayWiseData : async(req,res)=>{
        try {
            const {date} = req.query;
            const isoDate = new Date(date);
            const salesReport = await orderCollection.aggregate([
                { $match: { date: { $eq: isoDate } } }, // Match by date
                {
                  $group: {
                    _id: isoDate.toLocaleDateString(),
                    totalSales: { $sum: '$totalPrice' },
                    totalOrders: { $sum: 1 },
                    totalCouponDiscount: { $sum: { $cond: [{ $eq: ['$couponDiscount', null] }, 0, '$couponDiscount'] } },//if coupon discount is null then Coupon Discount will be zero 
                    totalMRPDiscount:{$sum: '$productPriceDiscount'}
                  },
                },
            ]);
            res.json(salesReport);
        } catch (err) {
            console.log("error while getting day wise sales data:",err.message);
            res.render('admin/adminError',{title:"Error",admin:true,adminName:req.session.admin});
        }
    },

    getPeriodicSalesData : async(req,res)=>{
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
                const periodwiseSalesData = await orderCollection.aggregate(pipeline);
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
                const periodwiseSalesData = await orderCollection.aggregate(pipeline);
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
                const periodwiseSalesData = await orderCollection.aggregate(pipeline);
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
                return {...order,date:formattedDate}
              });
              const data = {periodwiseSalesData:formattedDatePeriodwiseSalesData, period:"daily"}
              res.json(data);
            }
        } catch (err) {
            console.log("Error while running getPeriodicSalesData:",err.message);
            res.render('admin/adminError',{title:"Error",admin:true,adminName:req.session.admin});
        }
    }
}