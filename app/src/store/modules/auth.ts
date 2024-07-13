import {
  getterTree,
  mutationTree,
} from 'typed-vuex'
import { to } from 'await-to-js'

import type { IdTokenResult, User } from 'firebase/auth'
import type { RoleValueLiterals } from '@/store/modules/bundle'
import { FbCustomClaims } from '@/schema/FbAuthUser'
import { setUser } from '@sentry/vue'

const initialState = {
  loginUser: {} as User|undefined,
  role: "" as RoleValueLiterals,
  isAccountant: false,
  disabledEmailPrefix: "disableduser-",
}

const getState = () => initialState

const getters = getterTree(getState, {
  isLoggedIn: (state : typeof initialState) => state.loginUser?.uid != null,
  isAccountant: (state : typeof initialState) => state.isAccountant,
  loginUser: (state : typeof initialState) => state.loginUser,
  uid: (state : typeof initialState) => state.loginUser?.uid,
  role: (state : typeof initialState) => state.role,
  disabledEmailPrefix: (state : typeof initialState) => state.disabledEmailPrefix,
})

const mutationMethods = {
  async changeLoginUser(state : typeof initialState, user? : User) {
    state.loginUser = user ?? undefined
    if(user != null) {
      const [error, idTokenResult] = await to<IdTokenResult, Error>(user.getIdTokenResult())
      if(error) {
        throw Error(`Error: Failed to retreive auth user's idTokenResult: ${JSON.stringify(error)}`)
      }
      setUser({id: user.uid, email: user.email!})
      state.role = idTokenResult.claims.role as typeof state.role
      if(idTokenResult.claims.isAccountant) {
        state.isAccountant = idTokenResult.claims.isAccountant as boolean
      }
    } else {
      state.role = "out-source"
      state.isAccountant = false
    }
    console.log(`### Auth state is changed! : role -> "${state.role}", isAccountant -> "${state.isAccountant}"`)
    console.log(`### email: ${state.loginUser?.email}, uid: ${state.loginUser?.uid}`)
  },
}

if(process.env.isTesting) {
  //@ts-expect-error
  mutationMethods.__loginUser = (state : typeof initialState, user : User) => state.loginUser = user
  //@ts-expect-error
  mutationMethods.__customClaims = (state : typeof initialState, claims : FbCustomClaims) => {
    //@ts-expect-error
    Object.keys(claims).forEach(key => state[key] = claims[key])
  }
  //@ts-expect-error
  mutationMethods.__isAccountant = (state : typeof initialState, isAccountant : boolean) => state.isAccountant = isAccountant
}

const mutations = mutationTree(getState, mutationMethods)

export default {state: getState, getters, mutations}