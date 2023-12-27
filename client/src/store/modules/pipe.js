const state = () => ({
  lastData: null
})

export default {
  state,
  getters: {
    lastData: (state) => state.lastData,
  },
  mutations: {
    lastData: (state, val) => state.lastData = val
  }
}
