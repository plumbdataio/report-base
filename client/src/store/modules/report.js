const state = () => ({
  reporterName: "",
  shiftPattern: 'regular',
  lastReport: null
})

export default {
  state,
  getters: {
    reporterName: (state) => state.reporterName,
    shiftPattern: (state) => state.shiftPattern,
    lastReport: (state) => state.lastReport
  },
  mutations: {
    reporterName(state, name) {
      state.reporterName = name
    },
    lastReport(state, lastReport) {
      state.lastReport = lastReport
      state.shiftPattern = lastReport.shiftPattern
      state.reporterName = lastReport.name
    }
  }
}