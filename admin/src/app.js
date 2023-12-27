console.log("### app.js")
import Vue from 'vue'
import router from '@/router/index.js'
import store from '@/store/index.js'

import firebase from '@/firebase/index.js'
Vue.prototype.$firebase = firebase

import VClickOutside from 'v-click-outside'
Vue.use(VClickOutside)

// Make dayjs accessible through this.$dayjs
import dayjs from 'dayjs'
Vue.prototype.$dayjs = dayjs
import ja from 'dayjs/locale/ja'
dayjs.locale(ja) // add plug-in to show day of week in Japanese
import dayjsDuration from 'dayjs/plugin/duration'
dayjs.extend(dayjsDuration)

import Vuelidate from 'vuelidate'
Vue.use(Vuelidate)

import VueMq from 'vue-mq'
Vue.use(VueMq, {
  breakpoints: {
    sm: 450,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: Infinity,
  }
})

// bootstrap-vue Settings
import {BootstrapVue} from 'bootstrap-vue'
Vue.use(BootstrapVue)

// Import App Component
import App from '@/app.vue'
Vue.component('app', App)

// Import Global Component
import HeaderRow from '@/components/header-row.vue'
Vue.component('HeaderRow', HeaderRow)
import DatePicker from '@/components/date-picker.vue'
Vue.component('DatePicker', DatePicker)
import MonthPicker from '@/components/month-picker.vue'
Vue.component('MonthPicker',MonthPicker)

import '@/css/main.css';

// Init App
new Vue({
  el: '#app',
  render: (h) => h(App),
  router,
  store,
})