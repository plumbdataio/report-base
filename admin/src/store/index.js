import Vue from 'vue'
import Vuex from 'vuex'
import createPersistedState from 'vuex-persistedstate'

import auth from './modules/auth'
import pages from './modules/pages.js'
import session from './modules/session.js'

// importing es6-promise makes Vuex available on IE11
import 'es6-promise/auto'
Vue.use(Vuex)

// const debug = process.env.NODE_ENV !== 'production'

const toLocalStorage = {auth, pages}
const toSessionStorage = {session}

export default new Vuex.Store({
  modules: {
    ...toLocalStorage,
    ...toSessionStorage,
  },
  plugins: [
    createPersistedState({
      paths: Object.keys(toLocalStorage),
      storage: window.localStorage
    }),
    createPersistedState({
      paths: Object.keys(toSessionStorage),
      storage: window.sessionStorage
    }),
  ],
  // strict: debug
  strict: false //Numerous errors are shown when debug==true
})