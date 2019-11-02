<template>
    <div id="main" v-if="Store.isLoad">
        <div id="user-content">
            <div v-if="Store.user.isLogged">
                    <div class="user-content_line">
                    <span class="txt-red" @click="Store.logOut()">
                        <i class="fa fa-sign-out" aria-hidden="true"></i>
                    </span>
                    {{Store.user.login}}
                </div>
            </div>
            <login v-else></login>
             <modal></modal>
        </div>
        <notifications group="foo" />
    </div>
</template>

<script>
import modal from './components/modal.vue';
import login from './components/login.vue';
import config from '../config';
import Store from './Store';
import $u from './core/utils';
import api from './core/api';

export default {
    components: {
        modal,
        login
    },
    data() {
        return {Store}
    },
    methods: {
    }
};

</script>
