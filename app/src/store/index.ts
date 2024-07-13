import Vue from 'vue'
//@ts-expect-error
import Vuex from 'vuex'
Vue.use(Vuex)

import { useAccessor } from 'typed-vuex'

import createPersistedState from 'vuex-persistedstate'

import auth from './modules/auth'
import pages from './modules/pages'
import bundles from './modules/bundle'
import session from './modules/session'

const storeObject = {
  modules: {
    auth,
    bundles,
    pages,
    session,
  },
  plugins: [
    createPersistedState({
      paths: ["auth", "pages"],
      storage: window.localStorage
    }),
    createPersistedState({
      paths: ["session"],
      storage: window.sessionStorage
    }),
  ],
  strict: false //Numerous errors are shown when debug==true
}

const store = new Vuex.Store(storeObject)
export const tstore = useAccessor(store, storeObject)
Vue.prototype.$tstore = tstore

export default store