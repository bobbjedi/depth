const pathDepth = require('./depthPath');

module.exports = {
    sell_BTC_BIP: new pathDepth('sell', 'BTC', 'BIP'),
    buy_BTC_BIP: new pathDepth('buy', 'BTC', 'BIP')
};
