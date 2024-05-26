const walletCollection = require('../../model/walletSchema');
const userCollection = require('../../model/userSchema'); 

module.exports = {
    getWallet : async(req,res)=>{
        try {
            const user = await userCollection.findOne({email:req.session.userid});
            const wallet = await walletCollection.findOne({userId:user._id}).lean();
            if(wallet){
                const transactionHistory = wallet.transactionHistory;
                const formattedDateWalletData = transactionHistory.map(transaction=>{
                    const transactionDate = transaction.transactionDate;
                    const formattedTransactionDate = transactionDate.toLocaleDateString();
                    return {...transaction,transactionDate:formattedTransactionDate};
                });
                return res.render('user/wallet',{title:"Wallet",loginName:req.session.username,wallet,formattedDateWalletData});
            }
            else{
                const newWallet = new walletCollection({
                    userId : user._id
                })
                await newWallet.save();
                return res.render('user/wallet',{title:"Wallet",loginName:req.session.username});
            }
            
        } catch (err) {
            console.log("Error while getting wallet:",err.message);
        }
    }
}