import {
  getterTree,
  mutationTree,
} from 'typed-vuex'

const initialState = {
  isPrinting: false,
}

const getState = () => initialState
const getters = getterTree(getState, {
  isPrinting: (state : typeof initialState) => state.isPrinting,
})

const mutations = mutationTree(getState, {
  setIsPrinting(state : typeof initialState, isPrinting : boolean) {
    state.isPrinting = isPrinting
  },
})

export default {
  state: getState,
  getters,
  mutations,
}