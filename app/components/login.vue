<template>
    <div id="form">
        <h2 style="text-align: center;">{{status}}</h2>
        <div id="login" v-if="user.isLoginned" class="form" required>
            <input type="text" v-model="user.login" placeholder="Login" required>
            <input type="password" v-model="user.password" placeholder="Password" required>
        </div>
        <div id="reg" v-else class="form">
            <input type="text" v-model="user.login" placeholder="Login" required>
            <input type="text" v-model="user.address" placeholder="Minter Address (MXc3r4...)" required>
            <input type="password" v-model="user.password" placeholder="Password" required>
        </div>
        <div class="but bg-blue hovered bg" @click="logreg">{{status}}</div>
        <div class="hovered" style="text-align:center; color: aliceblue;" @click="user.isLoginned =!user.isLoginned">
            <u v-if="user.isLoginned">Got registration?</u>
            <u v-else>Got login?</u>
        </div>
    </div>
</template>

<script>
import Store from '../Store';
import api from '../core/api';
import Vue from 'vue';
export default {
    data() {
        return {
            user: Store.user
        };
    },
    computed: {
        status() {
            return this.user.isLoginned ? 'Login' : 'Registration';
        }
    },
    methods: {
        logreg() {
            const user = this.user;
            if (!user.login || !user.password || !user.isLoginned && !user.address) {
                this.$notify({
                    type: 'error',
                    group: 'foo',
                    title: 'Error ' + this.status,
                    text: 'Fill in all the fields!'
                });
                return;
            }
            if (user.address && (user.address.length < 40 || !user.address.startsWith('Mx'))){
                this.$notify({
                    type: 'warn',
                    group: 'foo',
                    title: 'Error ' + this.status,
                    text: 'U minter adress must be Mx345536dsv34344...!'
                });
                return;
            }
            api({
                action: this.status.toLowerCase(),
                data: user
            }, (data) => {
                Vue.set(Store, 'user', Object.assign(Store.user, data));
                Store.$notify({
                    type: 'success',
                    group: 'foo',
                    title: 'Success ' + this.status,
                    text: 'Ready!'
                });
                Store.user.isLogged = true;
            });
        }
    }
};

</script>
