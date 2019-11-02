const DB = require('../DB');
const {closedOrdersDb} = DB;
const _ = require('underscore');
const log = require('../../helpers/log');
const $u = require('../../helpers/utils');
/**
 * @constructor type sell или buy
 */

const depths = {};
module.exports = class {
    constructor(type, baseCoin, altCoin) {
        this.baseCoin = baseCoin;
        this.altCoin = altCoin;
        this.pairName = baseCoin + '/' + altCoin;
        this.type = type;
        this.isBlocked = false;
        this.queue = []; // очередь
        this.prices = []; // [10, 13, 16, 17.4]
        this.opposit = type === 'buy' ? 'sell' : 'buy';
        depths[this.pairName] = depths[this.pairName] || {};
        depths[this.pairName][type] = this;
        this.init();
    }
    async init() {
        const memory = DB[this.type + 'DepthDb'];
        this.depth = await memory.findOne({}) || new memory(); // orders: {10: [{user_id: 1, value: 10, price}], 12: [{...}]}
        this.depth.orders = this.depth.orders || {};
        await this.save();
    }
    get orders(){
        return this.depth.orders;
    }
    get oppositeDepth() {
        return depths[this.pairName][this.opposit];
    }
    get depths(){
        return depths[this.pairName];
    }
    async save(){
        await this.depth.save();
    }
    updatePrices(){
        const prices = Object.keys(this.orders);
        prices.sort((a, b) => {
            return this.type === 'sell' ? a - b : b - a;
        });
        this.prices = prices;
    }
    /**
     * @param {Object} order {user, value, price}
     */
    async setOrder(order) {
        // TODO: проверить валиднось параметров!
        console.log('Пришел ордер');
        this.queue.push(order);
        this.setNextOrder();
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
            const result = await this[this.type](this.queue[0]);
            console.log({result});
            if (result){
                this.queue.shift();
            }
            this.unBlock();
        } catch (e) {
            this.unBlock();
            log.error('[catch setNextOrder]: ' + e);
        }
    }
    async sell(order) {
        const {user, price, value} = order;
        // TODO: порверить баланс юзера
        const {sell, buy} = this.depths;
        const {baseCoin, altCoin} = this;
        const maxBuyPrise = buy.prices[0];
        // Ставит в спред или ниже - отсрочка
        if (!maxBuyPrise || maxBuyPrise < price){
            console.log('setMakerOrder');
            return this.setMakerOrder(user, 'sell', price, value);
        }
    }
    async buy(order) {
        const {user, price, value} = order;
        // TODO: порверить баланс юзера
        const {sell, buy} = this.depths;
        const {baseCoin, altCoin} = this;
        const minSellPrise = sell.prices[0];
        // Ставит в спред или ниже - отсрочка
        if (!minSellPrise || minSellPrise > price){
            console.log('setMakerOrder');
            return this.setMakerOrder(user, 'buy', price, value);
        }
        // ставит чтобы чистить стакан вверх
        let leftValue = value;
        while (sell.prices.length && leftValue > 0){ // пока есть селлы в стакане и не все купил заявленное чистим
            try {
                const nextOrdersLinePrice = sell.prices[0];
                if (nextOrdersLinePrice > price){ // сьели и уперлись в свою цену - ставим остаток в ордер по заявленной цене
                    await this.setMakerOrder(user, 'buy', price, leftValue);
                    console.log('Ставим остаток в ордер', {price, leftValue});
                }
                const linePriceOrders = sell.orders[nextOrdersLinePrice];

                for (let i = 0; i < linePriceOrders.length && leftValue > 0; i++){
                    const order = linePriceOrders[i];
                    let differentValues = $u.round(leftValue - order.value);
                    let currentValue;
                    if (differentValues < 0){ // кончился ордер тейкера
                        currentValue = leftValue;
                        order.value -= leftValue;
                        leftValue = 0;
                    } else { // кончился ордер мейкера
                        linePriceOrders[i].shift(); // удаляем ордер из линии цен
                        currentValue = order.value;
                        leftValue = differentValues;
                    }

                    const baseCoinAmount = leftValue * price;
                    const seller = await $u.getUserFromQ({_id: order.user_id});
                    await this.userSellCoin(seller, currentValue, baseCoinAmount);
                    await this.userBuyCoin(user, currentValue, baseCoinAmount);

                // TODO: closeOrdersDb
                }
                if (linePriceOrders.length === 0){ // растрепали линию
                    sell.prices.shift();
                }
            } catch (e) {
                log.error('set BUY ', e);
                return false;
            }
        }
        return true;

    }
    async userSellCoin(seller, amount, baseCoinAmount){
        const {altCoin, baseCoin} = this;
        seller.deposits[baseCoin].balance += baseCoinAmount;
        seller.deposits[altCoin].pending -= amount; // убираем из заморозки
        seller.deposits[altCoin].balance -= amount; // снимаем со счета
        await seller.save();
        return true;
    }

    async userBuyCoin(buyer, amount, baseCoinAmount){
        const {altCoin, baseCoin} = this;
        buyer.deposits[altCoin].balance += amount; // купил альта
        buyer.deposits[baseCoin].balance -= baseCoinAmount; // отдал базу
        await buyer.save();
        return true;
    }
    async setMakerOrder(user, type, price, value){
        try {
            const priceArray = this.depths[type].orders[price] || [];
            priceArray.push({value, price, user_id: user._id, time: $u.unix()}); // кладем ордер юзера
            this.depths[type].orders[price] = priceArray;// закинули обновленный

            let pendingCoinName = this.altCoin;
            let pendingValue = value;
            if (type === 'buy'){
                pendingCoinName = this.baseCoin;
                pendingValue = value * price;
            }
            user.deposits[pendingCoinName].pending += pendingValue;
            await user.save();
            await this.save();
            return true;
        } catch (e){
            console.log(e);
            log.error('setMakerOrder: ' + e);
            return false;
        }
    }

};

