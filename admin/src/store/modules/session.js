const initialState = {
  isPrinting: false,
}

export default {
  state: initialState,
  getters: {
    isPrinting: (state) => state.isPrinting,
  },
  mutations: {
    isPrinting(state, isPrinting) {
      state.isPrinting = isPrinting
    },
  }
}