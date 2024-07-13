import '@/ts/init_vue'
import Vue from 'vue'
import router from '@/router/index.js'
import store from '@/store/index'
import '@/ts/init_sentry'

import $firebase from '@/firebase/index'
Vue.prototype.$firebase = $firebase

// Make dayjs accessible through this.$dayjs
import dayjs from 'dayjs'
Vue.prototype.$dayjs = dayjs
import ja from 'dayjs/locale/ja'
dayjs.locale(ja) // add plug-in to show day of week in Japanese
import dayjsDuration from 'dayjs/plugin/duration'
dayjs.extend(dayjsDuration)

import Vuelidate from 'vuelidate'
Vue.use(Vuelidate)

import VClickOutside from 'v-click-outside'
Vue.use(VClickOutside)

import VueMq from 'vue-mq'
export const BreakPoints = {
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: Infinity,
}
Vue.use(VueMq, {breakpoints: BreakPoints})

import { $optionValueTo } from '@/ts/utils'
Vue.prototype.$optionValueTo = $optionValueTo

import '@/mixins/global'

// Import Global Component
import HeaderRow from '@/sfc/components/header-row.vue'
Vue.component('HeaderRow', HeaderRow)
import DatePicker from '@/sfc/components/date-picker.vue'
Vue.component('DatePicker', DatePicker)
import MonthPicker from '@/sfc/components/month-picker.vue'
Vue.component('MonthPicker',MonthPicker)

import '@/css/main.css';

// Import App Component
import App from '@/app.vue'
Vue.component('app', App)

// Init App
new Vue({
  el: '#app',
  render: (h) => h(App),
  router,
  //@ts-expect-error
  store
})