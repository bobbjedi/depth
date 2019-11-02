<template>
  <div id="depth">
      <div id="sell">
            <div class="sell-price-line price-line txt-yellow">
              <div class="price">Price</div>
              <div class="value">Value</div>
          </div>
          <div class="sell-price-line price-line"
                v-for="(o, i) in reducedValues.sell"
                @click="getPrice(+o.price)"
                :key="i">
              <div class="price">{{o.price}}</div>
              <div class="value bg-red">{{o.values}}</div>
          </div>
      </div>
      <div id="buy">
       <div class="sell-price-line price-line"
            v-for="(o, i) in reducedValues.buy"
            @click="getPrice(+o.price)"
            :key="i">
              <div class="value bg-green">{{o.values}}</div>
              <div class="price">{{o.price}}</div>
          </div>
            <div class="buy-price-line price-line txt-yellow">
              <div class="value">Value</div>
               <div class="price">Price</div>
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
            reducedValues: {
                sell: [],
                buy: []
            }
        }
    },
    created() {
        Store.components.depth = this;
        Store.$watch('allData', newVal=>{
            let sell = [];
            let buy = [];
            const {buyOrders, sellOrders} = newVal;
            Object.keys(buyOrders)
                .sort((a, b) => b - a)
                .forEach(p => {
                    let values = buyOrders[p].reduce((sum, o) =>{
                        return sum + o.value;
                    }, 0);
                    buy.push({price: p, values});
                });
            Object.keys(sellOrders)
                .sort((a, b) => b - a)
                .forEach(p => {
                    let values = sellOrders[p].reduce((sum, o) =>{
                        return sum + o.value;
                    }, 0);
                    sell.push({price: p, values});
                });
             this.reducedValues.sell = sell;
             this.reducedValues.buy = buy;
        });
    },
    methods: {
        getPrice(p) {
            Store.components.terminal.setPrice(p)
        }
    }

}
</script>
