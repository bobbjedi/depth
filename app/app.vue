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
        </div>
        <depth></depth>
        <terminal></terminal>
         <modal></modal>
        <notifications group="foo" />
    </div>
</template>

<script>
import modal from './components/modal.vue';
import login from './components/login.vue';
import depth from './components/depth.vue';
import terminal from './components/terminal.vue';
import config from '../config';
import Store from './Store';
import $u from './core/utils';
import api from './core/api';

export default {
    components: {
        modal,
        depth,
        terminal,
        login
    },
    data() {
        return {Store}
    },
    methods: {
    }
};

</script>
