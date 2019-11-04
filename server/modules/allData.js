const {usersDb} = require('./DB');
const depth = require('./depth');
const $u = require('../helpers/utils');

module.exports = async () =>{
    const allUsers = await usersDb.find({});
    const users = [];
    for (let u of allUsers){
        users.push(await $u.getUserFromQ({_id: u._id}, {openOrders: 'BTC_BIP', closeOrders: 'BTC_BIP'}));
    }
    return {
        depth: depth.BTC_BIP.depth,
        users
    };
};

// module.exports.reset = async ()=>{
 
// };