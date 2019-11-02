const depth = require('./index');
const {userDb} = require('../DB');
const $u = require('../../helpers/utils');

setTimeout(async () => {
    console.log('__Test__');
    const {sell, buy} = depth;
    const dev = $u.getUserFromQ({login: dev});
    buy.setOrder({value: 100, price: 10, user: dev});
}, 1000);
