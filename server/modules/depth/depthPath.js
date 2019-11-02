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
        const memory = DB[this.type + 'DepthDB'];
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
        this.queue.push(order);
        this.setNextOrder();
    }
    async block(){
        this.isBlocked = true;
    }
    async unBlock(){
        this.isBlocked = false;
        this.setNextOrder();
    }
    async setNextOrder() {
        try {
            if (this.isBlocked) {
                return;
            } else if (!this.queue.length){
                this.unBlock();
                return;
            }
            const result = await set[this.type](this.queue[0]);
            console.log({result});
            this.unBlock();
        } catch (e) {
            this.unBlock();
            log.error('[catch setNextOrder]: ' + e);
        }
    }
    async buy(order) {
        const {user, price, value} = order;
        // TODO: порверить баланс юзера
        const {sell, buy} = this.depths;
        const {baseCoin, altCoin} = this;
        const minSellPrise = sell.prices[0];

        // Ставит в спред или ниже - отсрочка
        if (minSellPrise > price){
            this.setMakerOrder(user, 'buy', price, value);
            return true;
        }
        // ставит чтобы чистить стакан вверх
        let leftValue = value;
        while (sell.prices.length && leftValue > 0){ // пока есть селлы в стакане и не все купил заявленное чистим

            const nextOrdersPrice = sell.prices[0];
            const orders = sell.orders[nextOrdersPrice];

            for (let i = 0; i < orders.length; i++){
                const order = orders[i];
                let differentValues = $u.round(leftValue - order.value);
                let currentValue;
                if (differentValues >= 0){ // снесет и поедет дальше
                    currentValue = order.value;
                } else if (differentValues < 0){ // остановится здесь
                    currentValue = leftValue;
                }
                const baseCoinAmount = leftValue * price;
                const seller = await $u.getUserFromQ({_id: order.user_id});
                await this.userSellCoin(seller, currentValue, baseCoinAmount);
                await this.userBuyCoin(user, currentValue, baseCoinAmount);
                leftValue = differentValues;

                //TODO: тут или перещелкнуть цену на следующую, если следующей нет - значит ставим остаток в новый ордер
                //TODO: если остался недоеденный мейкер - надо его поставить
                //TODO: удалить ордер из списка ордеров

                // TODO: closeOrdersDb
            }
        }

        if (leftValue > 0){
            // TODO: Сьел весь стакан до своей цены.
        }
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
    setMakerOrder(user, type, price, value){
        const priceArray = this.depths[type].orders[price] || [];
        priceArray.push({value, price, user_id: user._id}); // кладем ордер юзера
        let pendingCoinName = this.altCoin;
        let pendingValue = value;
        if (type === 'buy'){
            pendingCoinName = this.baseCoin;
            pendingValue = value * price;
        }
        user.deposits[pendingCoinName].pending += pendingValue;
    }
};

const set = {
    async sell(order) {

    },

};

