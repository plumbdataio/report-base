const state = () => ({
  isMaintenanceWindow: false,
  maintenanceDuration: "",
  showSidebar: true,
  project: {},
  monthSelected: null, // format: "YYYY-MM"
  reportCopied: {},
  qrList: []
})

export default {
  state,
  getters: {
    isMaintenanceWindow: (state) => state.isMaintenanceWindow,
    maintenanceDuration: (state) => state.maintenanceDuration,
    showSidebar: (state) => state.showSidebar,
    project: (state) => state.project,
    monthSelected:(state) => state.monthSelected,
    reportCopied:(state) => state.reportCopied,
    qrList: (state) => state.qrList,
  },
  mutations: {
    isMaintenanceWindow(state, bool) {
      state.isMaintenanceWindow = bool
    },
    maintenanceDuration(state, durationString) {
      state.maintenanceDuration = durationString
    },
    showSidebar(state, bool) {
      state.showSidebar = bool
    },
    project(state, project) {
      state.project = project
    },
    monthSelected(state, monthSelected) {
      state.monthSelected = monthSelected
    },
    reportCopied(state, reportCopied) {
      state.reportCopied = reportCopied
    },
    qrList(state, list) {
      state.qrList = list
    },
  }
}