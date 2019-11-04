<template>
    <div id="terminal">
        <div class="terminal-block">
            <p class="txt-red">SELL</p>
            <label>Price</label>
            <input placeholder="Price" type="number" v-model.number="sellPrice">
            <label>Value</label>
            <input placeholder="Value" type="number" v-model.number="sellValue">
            <div class="hovered but bg-red" @click="sendOrder('sell')">SELL</div>
        </div>
        <div class="terminal-block">
            <p class="txt-green">BUY</p>
             <label>Price</label>
            <input placeholder="Price" type="number" v-model.number="buyPrice">
            <label>Value</label>
            <input placeholder="Value" type="number" v-model.number="buyValue">
            <div class="hovered but bg-green" @click="sendOrder('buy')">BUY</div>
        </div>
        <select v-model="userName">
            <option v-for="(u, i) in users" :key="i">{{u.login}}</option>
        </select>
    </div>
</template>

<script>
import Store from '../Store';
import api from '../core/api';
export default {
    data() {
        return {
            userName: '',
            users: [],
            buyPrice: 0,
            buyValue: 0,
            sellPrice: 0,
            sellValue: 0
        }
    },
    created() {
        Store.components.terminal = this;
        Store.$watch('allData', newVal => {
            this.users = newVal.users;
            if (this.userName === '') {
                this.userName = this.users[0].login;
            }
        });
    },
    methods: {
        setPrice(p) {
            this.buyPrice = this.sellPrice = p;
        },
        sendOrder(type) {
            const price = this[type + 'Price'];
            const value = this[type + 'Value'];
            const login = this.userName;
            api({
                action: 'setOrder',
                data: {type, price, value, login, pairName: 'BTC_BIP'}
            }, data =>{
                console.log('Set order data:', data);
                Store.updateAll();
            });
        }
    }
};
</script>
