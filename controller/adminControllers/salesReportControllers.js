const orderCollection = require('../../model/orderSchema');

module.exports = {
    getSalesData : async(req,res)=>{
        try {
            const orders = await orderCollection.find().populate('productsData');
            console.log("orders:",orders);
            const totalNumberOfOrders = orders.length;
            const totalRevenue = orders.reduce((acc,curr)=>acc+curr.totalPrice ,0).toFixed(2);
            const overallCouponDiscount = orders.reduce((acc,curr)=>acc+curr.couponDiscount,0).toFixed(2);
            console.log("totalRevenue:",totalRevenue);
            console.log("overallCouponDiscount:",overallCouponDiscount);
            
            res.render('admin/adminSalesReport',{admin:true,
                title:"Sales Report",
                adminName:req.session.admin,
                totalNumberOfOrders,
                totalRevenue,
                overallCouponDiscount,

            })
        } catch (err) {
            console.log("Error while getting sales data: ",err.message);
        }
    }
}