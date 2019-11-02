import Vue from 'vue/dist/vue.js';
Vue.filter('capitalize', function (value) {
    if (!value) {
        return '';
    };
    value = value.toString();
    return value.charAt(0).toUpperCase() + value.slice(1);
});

Vue.filter('round', v => {
    if (!v) {
        return 0;
    }
    return +v.toFixed(8);
});

Vue.filter('thousandSeparator', (num)=>{
    let fixed = 8;
    if (num > 0.8){
        fixed = 2;
    }
    if (+num === 0){
        return '0.00';
    }
    var parts = num.toFixed(fixed).split('.'),
        main = parts[0],
        len = main.length,
        output = '',
        i = len - 1;
    while (i >= 0) {
        output = main.charAt(i) + output;
        if ((len - i) % 3 === 0 && i > 0) {
            output = ',' + output;
        }
        --i;
    }
    if (parts.length > 1) {
        output = `${output}.${parts[1]}`;
    }
    return output;
});
