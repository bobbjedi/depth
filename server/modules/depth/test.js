const depth = require('./index');
const {userDb} = require('../DB');
const $u = require('../../helpers/utils');

setTimeout(async () => {
    console.log('__Test__');
    const {sell_BTC_BIP, buy_BTC_BIP} = depth;
    const dev = await $u.getUserFromQ({login: 'dev1'});
    buy_BTC_BIP.setOrder({value: 103, price: 11, user: dev});
}, 1000);
