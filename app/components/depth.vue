<template>
  <div id="depth">
      <div id="sell">
            <div class="sell-price-line price-line txt-yellow">
              <div class="price">Price</div>
              <div class="value">Value</div>
          </div>
          <div class="sell-price-line price-line"
                v-for="(price, i) in Object.keys(depth.sell).reverse()"
                @click="getPrice(+price)"
                :key="i">
              <div class="price txt-red">{{price}}</div>
              <div class="value bg-red">{{depth.sell[price]}}</div>
          </div>
      </div>
      <div id="buy">
       <div class="buy-price-line price-line"
            v-for="(price, i) in Object.keys(depth.buy).reverse()"
                @click="getPrice(+price)"
                :key="i">
              <div class="price txt-green">{{price}}</div>
              <div class="value bg-green">{{depth.buy[price]}}</div>
          </div>
      </div>
  </div>
</template>

<script>
import api from '../core/api';
import Store from '../Store';

export default {
    data() {
        return {
        }
    },
    computed: {
        depth: ()=>Store.allData.depth
    },
    created() {
        Store.components.depth = this;
        // Store.$watch('allData', newVal=>{
            // let sell = [];
            // let buy = [];
            // const {buyOrders, sellOrders} = newVal;
            // Object.keys(buyOrders)
            //     .sort((a, b) => b - a)
            //     .forEach(p => {
            //         let values = buyOrders[p].reduce((sum, o) =>{
            //             return sum + o.value;
            //         }, 0);
            //         buy.push({price: p, values});
            //     });
            // Object.keys(sellOrders)
            //     .sort((a, b) => b - a)
            //     .forEach(p => {
            //         let values = sellOrders[p].reduce((sum, o) =>{
            //             return sum + o.value;
            //         }, 0);
            //         sell.push({price: p, values});
            //     });
            //  this.reducedValues.sell = newVal.sell;
            //  this.reducedValues.buy = newVal.buy;
        // });
    },
    methods: {
        getPrice(p) {
            Store.components.terminal.setPrice(p)
        }
    }

}
</script>
