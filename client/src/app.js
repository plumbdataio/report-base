import Vue from 'vue';
import App from '@/app.vue';

import store from '@/store/index.js'
import router from '@/router.js'

import {BootstrapVue} from 'bootstrap-vue'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
Vue.use(BootstrapVue)

import Vuelidate from 'vuelidate'
Vue.use(Vuelidate)

import VueMq from 'vue-mq'
Vue.use(VueMq, {
  breakpoints: {
    md: 768,
    lg: Infinity,
  }
})

new Vue({
  store,
  router,
  el: '#app',
  template: '<app/>',
  components: {
    app: App
  }
})