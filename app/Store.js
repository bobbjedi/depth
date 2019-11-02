import Vue from 'vue';
import api from './core/api';
import $u from './core/utils';
import config from '../config';
import axios from 'axios';

export default new Vue({
    data: {
        isLoad: false,
        user: {},
        isGame: false,
        isGameOver: false,
        rout: '',
        modal: {},
        config,
        system: {}
    },
    created() {
        this.logOut();
        this.user.token = localStorage.getItem('wstoken') || false;
        if (this.user.token) {
            this.updateUser();
        } else {
            this.isLoad = true;
        }
        this.updatePublic();
        setInterval(() => {
            this.updatePublic();
        }, 60 * 1000);
    },
    methods: {
        logOut(){
            this.user = {
                isLogged: false,
                isLoginned: true, // хочет логиниться / регаться
                password: '',
                login: '',
                address: '',
                token: false,
                deposit: 0
            };
        },
        updatePublic() {
            axios.get('/public').then(res => res.status === 200 ? this.system = res.data : '');
        },
        updateUser(cb = false) {
            this.isLoad = true;
            const self = this;
            api({action: 'getUser', token: this.user.token}, data => {
                self.user = data;
                cb && cb();
            });
        }
    },
    watch: {
        'user.token'() {
            localStorage.setItem('wstoken', this.user.token);
        }
    }
});
