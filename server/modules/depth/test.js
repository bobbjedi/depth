const depth = require('./index');
const {userDb} = require('../DB');
const $u = require('../../helpers/utils');

setTimeout(async () => {
    console.log('__Test__');
    const {BTC_BIP} = depth;
    const dev = await $u.getUserFromQ({login: 'dev1'}, {openOrders: 'BTC_BIP'});
    BTC_BIP.setOrder({type: 'buy', amount: 103, price: 11, user: dev});
}, 1000);
