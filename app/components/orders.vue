<template>
    <div id="orders">
        <div class="user-order-block" v-for="u in users" :key="u.login">
            <h4>Deposits {{u.login}}:</h4>
            BTC: {{u.deposits.BTC.balance - u.deposits.BTC.pending}} (pending:{{u.deposits.BTC.pending}})
            <br>
            BIP: {{u.deposits.BIP.balance - u.deposits.BIP.pending}} (pending: {{u.deposits.BIP.pending}})
            <h4>Open orders {{u.login}}:</h4>
            <table border="1" cellpadding="5" style="border-collapse: collapse; border: 1px solid black;">
                <tr>
                <td>PRICE</td>
                <td>AMOUNT</td>
                <td>BASE</td>
                <td>DATE</td>
                <td>CANCEL</td>
                </tr>
                <tr v-for="o in u.openOrders.BTC_BIP" :key="o._id"
                    :class="'txt-' + (o.type === 'sell' ? 'red' : 'green')">
                    <td>{{o.price}}</td>
                    <td>{{o.amount}}</td>
                    <td>{{o.baseCoinAmount}}</td>
                    <td>{{time(o.time)}}</td>
                    <td @click="close(o._id)" class="txt-red">X</td>
                </tr>
            </table>

            <h4>Close orders {{u.login}}:</h4>
            <table border="1" cellpadding="5" style="border-collapse: collapse; border: 1px solid black;">
                <tr>
                <td>PRICE</td>
                <td>AMOUNT</td>
                <td>BASE</td>
                <td>DATE</td>
                </tr>
                <tr v-for="o in u.closeOrders.BTC_BIP" :key="o._id"
                    :class="'txt-' + (o.type === 'sell' ? 'red' : 'green')">
                    <td>{{o.price}}</td>
                    <td>{{o.amount}}</td>
                    <td>{{o.baseCoinAmount}}</td>
                    <td>{{time(o.time)}}</td>
                </tr>
            </table>
        </div>
    </div>
</template>

<script>
import Store from '../Store';
import api from '../core/api';
export default {
    data() {
        return {}
    },
    computed: {
        users: ()=>Store.allData.users
    },
    created() {
        Store.components.orders = this;
    },
    methods: {
        time(u){
            return new Date(u).toLocaleDateString() + ' ' + new Date(u).toLocaleTimeString()
        },
        close(id){
            api({
                action: 'removeOrder',
                data: {orderId: id, pairName: 'BTC_BIP', login: Store.components.terminal.userName}
            }, ()=>{Store.updateAll()});
        }
    }
};
</script>
