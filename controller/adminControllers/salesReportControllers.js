const orderCollection = require('../../model/orderSchema');

module.exports = {
    getSalesData : async(req,res)=>{
        try {
            const orders = await orderCollection.find().populate('productsData.productId').lean();
            //console.log("orders:",orders);
            const totalNumberOfOrders = orders.length;
            const totalRevenue = orders.reduce((acc,curr)=>acc+curr.totalPrice ,0).toFixed(2);
            const overallCouponDiscount = orders.reduce((acc,curr)=>acc+curr.couponDiscount,0).toFixed(2);
            //console.log("totalRevenue:",totalRevenue);
            let pipeline = [
              {
                $group: {
                  _id: {
                    day: { $dayOfMonth: '$date' },
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

            const dailySalesData = await orderCollection.aggregate(pipeline);
            console.log("periodwiseSalesData:",dailySalesData);

            
            res.render('admin/adminSalesReport',{admin:true,
                title:"Sales Report",
                adminName:req.session.admin,
                totalNumberOfOrders,
                totalRevenue,
                overallCouponDiscount,
                dailySalesData
            })
        } catch (err) {
            console.log("Error while getting sales data: ",err.message);
        }
    },

    getCustomDateSalesData : async(req,res)=>{
      try {
        const {fromDate,toDate} = req.query;
        console.log(fromDate,toDate);
        const isoFromDate = new Date(fromDate);
        const isoToDate = new Date(toDate);
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
        console.log("customDateSalesReport:",customDateSalesReport);
        res.json(customDateSalesReport);
      } catch (err) {
        console.log("Error while getting CutomDateSalesData:",err.message);
      }
    },

    getDayWiseData : async(req,res)=>{
        try {
            const {date} = req.query;
            console.log(req.query);
            console.log("req:",date);
            const isoDate = new Date(date);
            console.log("isoDate:",isoDate);
            const salesReport = await orderCollection.aggregate([
                { $match: { date: { $eq: isoDate } } }, // Match by date
                {
                  $group: {
                    _id: isoDate.toDateString(),
                    totalSales: { $sum: '$totalPrice' },
                    totalOrders: { $sum: 1 },
                    totalCouponDiscount: { $sum: { $cond: [{ $eq: ['$couponDiscount', null] }, 0, '$couponDiscount'] } },//if coupon discount is null then Coupon Discount will be zero 
                    totalMRPDiscount:{$sum: '$productPriceDiscount'}
                  },
                },
            ]);
            console.log("salesReport:",salesReport);
            res.json(salesReport);
        } catch (err) {
            console.log("error while getting day wise sales data:",err.message);
        }
    },

    getPeriodicSalesData : async(req,res)=>{
        try {
            const {groupBy} = req.query;
            console.log("groupBy:",groupBy);
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
                console.log("periodwiseSalesData:",periodwiseSalesData);
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
                console.log("periodwiseSalesData:",periodwiseSalesData);
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
                console.log("periodwiseSalesData:",periodwiseSalesData);
                const data = {periodwiseSalesData:periodwiseSalesData, period:"yearly"}
                res.json(data);
            }else if(groupBy === 'daily'){
              pipeline = [
                {
                  $group: {
                    _id: {
                      day: { $dayOfMonth: '$date' },
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
              console.log("periodwiseSalesData:",periodwiseSalesData);
              const data = {periodwiseSalesData:periodwiseSalesData, period:"daily"}
              res.json(data);
            }
        } catch (err) {
            console.log("Error while running getPeriodicSalesData:",err.message);
        }
    },

    

}