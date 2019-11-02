<template>
<div id="modal" class="bg" :class="{'show-modal': isShow}">
    <div id="modal-content">
        <div id="modal-header" class="bg-blue bg">
            <span class="title">{{header}}</span>
            <i class="fa fa-times-circle-o hovered" aria-hidden="true" @click="hide"></i>
        </div>
        <div id="modal-body" v-html="body"></div>
        <div id="modal-but">
            <div class="but bg-red hovered bg" @click="hide" v-show="cb">Cancel</div>
            <div class="but hovered bg bg-green" @click="success">Ok</div>
        </div>
    </div>
</div>
</template>

<script>
import Store from '../Store';

export default {
    data() {
        return {
            isShow: false,
            body: 'Body',
            header: 'Header',
            cb: null
        }
    },
    created() {
        Store.modal = this;
    },
    methods: {
        show(params) {
            this.isShow = true;
            Object.assign(this, params);
        },
        hide() {
            this.isShow = false;
            this.cb = null;
        },
        success() {
            this.cb && this.cb();
            this.hide();
        }
    }
}
</script>
