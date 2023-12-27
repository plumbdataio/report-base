export default {
  state: {
    loginUser: null,
    role: null,
    isAccountant: false,
  },
  getters: {
    isLoggedIn: (state) => state.loginUser != null,
    loginUser: (state) => state.loginUser,
    role: (state) => state.role,
    isAccountant: (state) => state.isAccountant,
    uid: (state) => state.loginUser.uid,
  },
  mutations: {
    changeLoginUser(state, user) {
      state.loginUser = user
      if(user !== null) {
        user.getIdTokenResult().then(idTokenResult => {
          state.role = idTokenResult.claims.role
          if(idTokenResult.claims.isAccountant != null) {
            state.isAccountant = idTokenResult.claims.isAccountant
          }
        })
      } else {
        state.role = null
        state.isAccountant = false
      }
      console.log(`Auth state is changed! : role -> "${state.role}", isAccountant -> "${state.isAccountant}"`)
    },
  }
}