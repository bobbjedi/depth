const DB = require('../DB');
const _ = require('underscore');
const log = require('../../helpers/log');
const $u = require('../../helpers/utils');
/**
 * @constructor type sell или buy
 */

const depths = {};
module.exports = class {
    constructor(baseCoin, altCoin) {
        this.baseCoin = baseCoin;
        this.altCoin = altCoin;
        this.pairName = baseCoin + '_' + altCoin;
        this.isBlocked = false;
        this.queue = []; // очередь
        this.depth = {buy: {}, sell: {}}; // {10: 234} price: amount 
        this.prices = {buy: [], sell: []}; // [10, 13, 16, 17.4]
        depths[this.pairName] = this;
        this.ordersDb = DB[this.pairName + '_Depth'];
        this.closeOrdersDb = DB[this.pairName + '_CloseOrders'];
        this.updatePrices();
    }
    async getOrders(type) {
        const q = {};
        if (type) {
            q.type = type;
        }
        return await this.ordersDb.find(q);
    }
    async updatePrices(){
        const orders = await this.getOrders();
        const prices = {buy: [], sell: []}; // {price: 10, amount: 23}
        const depth = {buy: {}, sell: {}};

        orders.forEach(o=>{
            const {type, price, amount} = o;
            prices[type].push(price);
            depth[type][price] = depth[type][price] + amount || amount;
        });

        prices.buy = _.unique(prices.buy);
        prices.sell = _.unique(prices.sell);
        
        prices.sell.sort((a, b) => a - b);
        prices.buy.sort((a, b) => b - a);

        this.prices.sell = prices.sell;
        this.prices.buy = prices.buy;
        this.depth = depth;
        console.log('UPDATE', {depth, prices});
    }
    /**
     * @param {Object} order {user, amount, price}
     */
    async setOrder(order) {
        // const user = order.user;//
        // TODO: проверить валиднось параметров и баланс юзера!
        this.queue.push(order);
        await this.setNextOrder();
    }
    async block(){
        this.isBlocked = true;
    }
    async unBlock(){
        if (this.isBlocked){
            this.isBlocked = false;
            this.setNextOrder();
        }
    }
    async setNextOrder() {
        console.log('Set next');
        try {
            if (!this.queue.length) {
                this.unBlock();
                return;
            }
            if (this.isBlocked){
                return;
            }
            const order = this.queue.shift();
            const result = await this.setOrderInDepth(order);
            console.log({result});
            this.unBlock();
        } catch (e) {
            this.unBlock();
            log.error('[catch setNextOrder]: ' + e);
        }
    }
    async setOrderInDepth(order) {
        const {user, price, amount, type} = order;
        const taker = await $u.getUserFromQ({_id: user._id});
        const opposite = type === 'sell' ? 'buy' : 'sell';
        // TODO: порверить баланс юзера
        let pricesOpposite = this.prices[opposite];
        let currentPrice = pricesOpposite[0];
        const checkPriceTaker = (depthPrice, orderPrice)=> { //  свой цвет
            if (type === 'buy'){
                return depthPrice <= orderPrice;
            }
            return depthPrice >= orderPrice;
        };
        console.log({pricesOpposite, currentPrice, price, isTaker: checkPriceTaker(currentPrice, price)});
        // Ставит в спред или ниже - отсрочка
        if (!currentPrice || !checkPriceTaker(currentPrice, price)){ // если не тейкер то ставим новый ордер
            return this.setMakerOrder(taker, type, price, amount);
        }
        console.log('Чистим');
        // ставит чтобы чистить стакан вверх
        let leftAmount = amount;
        // return;
        while (pricesOpposite.length && leftAmount > 0 && checkPriceTaker(currentPrice, price)){ // пока есть селлы в стакане и не все купил заявленное чистим
            try {
                const ordersLinePrice = await this.ordersDb.find({type: opposite, price: currentPrice}); // селлы на этой цене
                for (let i = 0; i < ordersLinePrice.length && leftAmount > 0; i++){ // перебираем селлы
                    const order = ordersLinePrice[i];
                    let differentAmounts = $u.round(leftAmount - order.amount);
                    let currentAmount;
                    if (differentAmounts < 0){ // кончился ордер тейкера
                        console.log('Кончился тейкер!');
                        currentAmount = leftAmount;
                        order.amount = $u.round(order.amount - leftAmount); // вычисляем остаток в ордере
                        order.baseCoinAmount = $u.round(order.amount * order.price); // вычисляем остаток в ордере
                        await order.save();
                        leftAmount = 0;
                    } else { // кончился ордер мейкера
                        console.log('Кончился мейкер');
                        await order.remove(); // удаляем ордер из стакана
                        currentAmount = order.amount;
                        leftAmount = differentAmounts;
                    }

                    const baseCoinAmount = currentAmount * currentPrice;
                    let maker = await $u.getUserFromQ({_id: order.user_id});
                    if (maker._id === taker._id){ // сам у себя купил
                        maker = taker;
                    }
                    if (type === 'buy'){
                        await this.userSellCoin(maker, currentAmount, baseCoinAmount, currentPrice, true);
                        await this.userBuyCoin(taker, currentAmount, baseCoinAmount, currentPrice);
                    } else {
                        await this.userSellCoin(taker, currentAmount, baseCoinAmount, currentPrice);
                        await this.userBuyCoin(maker, currentAmount, baseCoinAmount, currentPrice, true);
                    }
                }
                await this.updatePrices();
                currentPrice = this.prices[opposite][0]; // очередная цена
            } catch (e) {
                log.error('set BUY/SELL ' + e);
                return false;
            }
        }
        if (leftAmount){
            return this.setMakerOrder(taker, type, price, leftAmount);
        }
        return true;
    }
    async userSellCoin(seller, amount, baseCoinAmount, price, isMaker){
        const {altCoin, baseCoin} = this;
        seller.deposits[baseCoin].balance += baseCoinAmount;
        seller.deposits[altCoin].balance -= amount; // снимаем со счета
        this.closeOrdersDb.db.insert({
            user_id: seller._id,
            time: $u.unix(),
            amount,
            baseCoinAmount,
            price,
            type: 'sell'
        });
        await seller.save();
        return true;
    }

    async userBuyCoin(buyer, amount, baseCoinAmount, price, isMaker){
        const {altCoin, baseCoin} = this;
        amount = $u.round(amount);
        price = $u.round(price);
        buyer.deposits[altCoin].balance = $u.round(buyer.deposits[altCoin].balance + amount); // купил альта
        buyer.deposits[baseCoin].balance = $u.round(buyer.deposits[baseCoin].balance - baseCoinAmount); // отдал базу
        this.closeOrdersDb.db.insert({
            user_id: buyer._id,
            time: $u.unix(),
            amount,
            baseCoinAmount,
            price,
            type: 'buy'
        });
        await buyer.save();
        return true;
    }
    async setMakerOrder(user, type, price, amount){
        try {
            const {altCoin, baseCoin} = this;
            amount = $u.round(amount);
            price = $u.round(price);
            let baseCoinAmount = $u.round(amount * price);
            await this.ordersDb.db.syncInsert({user_id: user._id, baseCoinAmount, time: $u.unix(), type, price, amount});
            await user.save();
            await this.updatePrices();
            return true;
        } catch (e){
            console.log(e);
            log.error('setMakerOrder: ' + e);
            return false;
        }
    }
    async removeOrder(data){
        try {
            const {user, orderId} = data;
            const order = await this.ordersDb.findOne({_id: orderId, user_id: user._id});
            if (!order){
                log.warn(`${user.login} пытылся удалить несуществующий или чужой ордер ${orderId}`);
                return false;
            }
            this.block();
            // удаляем ордер
            await order.remove();
            await user.save();
            await this.updatePrices();
            this.unBlock();
            return true;
        } catch (e){
            console.log(e);
            log.error('setMakerOrder: ' + e);
            return false;
        }
    }
};

