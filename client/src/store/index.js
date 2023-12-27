import Vue from 'vue'
import Vuex from 'vuex'
import createPersistedState from 'vuex-persistedstate'

import report from './modules/report.js'
import pipe from './modules/pipe.js'

// importing es6-promise makes Vuex available on IE11
import 'es6-promise/auto'
Vue.use(Vuex)

// const debug = process.env.NODE_ENV !== 'production'

export default new Vuex.Store({
  modules: {
    report,
    pipe,
  },
  plugins: [
    createPersistedState()
  ],
  // strict: debug
  strict: false //Numerous errors are shown when debug==true
})