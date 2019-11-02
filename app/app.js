import Vue from 'vue';
import './core/filters';
import Notifications from 'vue-notification';
Vue.use(Notifications);

import App from './app.vue';
new Vue({
    render: h => h(App)
}).$mount('#app');


window.copy = function (v) {
    const copytext = document.createElement('input');
    copytext.value = v;
    document.body.appendChild(copytext);
    copytext.select();
    document.execCommand('copy');
    document.body.removeChild(copytext);
    Vue.prototype.$notify({
        type: 'info',
        group: 'foo',
        title: "Информация:",
        text: 'Скопировано'
    });
};
