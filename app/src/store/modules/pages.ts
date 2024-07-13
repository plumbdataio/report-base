import {
  getterTree,
  mutationTree,
} from 'typed-vuex'

import type { Staff } from '@/schema/Staff'
import type { Report } from '@/schema/Report'

const initialState = {
  isMaintenanceWindow: false,
  maintenanceDuration: "",
  showSidebar: true,
  dbUser: {} as Staff,
  reportHistory: [] as Partial<Report>[],
}

const getState = () => initialState

const getters = getterTree(getState, {
  isMaintenanceWindow: (state : typeof initialState) => state.isMaintenanceWindow,
  maintenanceDuration: (state : typeof initialState) => state.maintenanceDuration,
  showSidebar: (state : typeof initialState) => state.showSidebar,
  dbUser: (state: typeof initialState) => state.dbUser,
  reportHistory: (state: typeof initialState) => state.reportHistory,
})

const mutations = mutationTree(getState, {
  setIsMaintenanceWindow(state : typeof initialState, bool : boolean) {
    state.isMaintenanceWindow = bool
  },
  setMaintenanceDuration(state : typeof initialState, durationString : string) {
    state.maintenanceDuration = durationString
  },
  setShowSidebar(state : typeof initialState, bool : boolean) {
    state.showSidebar = bool
  },
  setDbUser(state: typeof initialState, staff: Staff) {
    state.dbUser = staff
  },
  setReportHistory(state: typeof initialState, reports: Partial<Report>[]) {
    state.reportHistory = reports
  }
})

export default {
  state: getState,
  getters,
  mutations,
}