const DB = require('../../modules/DB')
const {usersDb, depositsDb} = DB;
const config = require('../../helpers/configReader');
const sha256 = require('sha256');
const log = require('../log');

module.exports = {
    clone: require('clone'),
    round(n) {
        return Number(n.toFixed(8));
    },
    unix(){
        return new Date().getTime();
    },
    async getUserFromQ (q, opt = {}) {
        const user = await usersDb.findOne(q);
        const {openOrders, closeOrders} = opt;
        if (!user){
            return;
        }

        if (openOrders){
            user.openOrders = {};
            user.openOrders[openOrders] = await DB[openOrders + '_Depth'].db.syncFind({user_id: user._id});
            const [baseCoin, altCoin] = openOrders.split('_');
            const {deposits} = user;
            user.openOrders[openOrders].forEach(o=>{
                if (o.type === 'sell'){
                    deposits[altCoin].pending += o.amount;
                } else {
                    deposits[baseCoin].pending += o.baseCoinAmount;
                }
            });
        };
        if (closeOrders){
            user.closeOrders = {};
            user.closeOrders[closeOrders] = await DB[closeOrders + '_CloseOrders'].db.syncFind({user_id: user._id});
        };
        return user;
    },

    async createUser(params){
        const {regDrop, knownCoins} = config;
        const deposits = {};
        knownCoins.forEach(c=>{
            deposits[c] = {
                balance: regDrop,
                pending: 0
            };
        });

        const user = new usersDb({
            deposits,
            address: params.address,
            login: params.login,
            password: sha256(params.password.toString())
        });
        await user.save();
        if (regDrop){
            depositsDb.db.syncInsert({user_id: user._id, amount: regDrop, type: 'regdrop'});
        }
        return user;
    }
};
