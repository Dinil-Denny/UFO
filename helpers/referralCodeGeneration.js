const crypto = require('crypto');
const referralCodeCollection = require('../model/referralCodeSchema');

module.exports = {
    generateReferralCode : async (codeLength)=>{
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let code;
        do{
            code = '';
            for(let i=0;i<codeLength;i++){
                code += characters.charAt(Math.floor(Math.random()*characters.length));
            }
        }while(await referralCodeCollection.findOne({referralCode:code}))
        return code;
    }
}