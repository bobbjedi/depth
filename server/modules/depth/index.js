const pathDepth = require('./depthPath');

module.exports = {
    sell: new pathDepth('sell', 'BTC', 'BIP'),
    buy: new pathDepth('buy', 'BTC', 'BIP')
};
