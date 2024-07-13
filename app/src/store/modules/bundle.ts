import {
  getterTree,
  mutationTree,
} from 'typed-vuex'

const projectStatus = [
  {value: "for-calculation", text: "(集計専用)"},
  {value: "pre-order", text: "未受注"},
  {value: "running", text: "稼働中"},
  {value: "completed", text: "完了"},
  {value: "order-lost", text: "失注"},
] as const
const projectStatusValues = projectStatus.map(item => item.value)
export type ProjectStatusValueLiterals = typeof projectStatusValues[number]

const projectRequireWorkDetail = [
  {value: "100", text: ""},
  {value: "500", text: ""},
] as const
const projectRequireWorkDetailValues = projectRequireWorkDetail.map(item => item.value)
export type ProjectRequireWorkDetailValueLiterals = typeof projectRequireWorkDetailValues[number]

const attendance = [
  {value: "regular-work", text: "出勤", textShort: "出勤", isAttended: true, projectId: null},
  {value: "holiday-work", text: "休日出勤", textShort: "休出", isAttended: true, projectId: null},
  {value: "half-paidoff", text: "有給(半休)", textShort: "半休", isAttended: true, projectId: 1},
  {value: "paidoff", text: "有給(全休)", textShort: "有給", isAttended: false, projectId: 1},
  {value: "dayoff", text: "公休", textShort: "公休", isAttended: false, projectId: null},
  {value: "compensatory-dayoff", text: "代休", textShort: "代休", isAttended: false, projectId: null},
  {value: "site-off", text: "現場休み", textShort: "現休", isAttended: false, projectId: null},
  {value: "absent", text: "欠勤", textShort: "欠勤", isAttended: false, projectId: 2},
] as const
const attendanceValues = attendance.map(item => item.value)
export type AttendanceValueLiterals = typeof attendanceValues[number]

const meals = [
  {value: "breakfast", text: "朝食"},
  {value: "lunch", text: "昼食"},
  {value: "dinner", text: "夕食"}
] as const
const mealsValues = meals.map(item => item.value)
export type MealsValueLiterals = typeof mealsValues[number]

const salaryType = [
  {value: "timely", text: "時給", unit: "円/時"},
  {value: "daily", text: "日給", unit: "円/日"},
  {value: "monthly-daybasis", text: "月給/日別計算", unit: "円/月"},
  {value: "monthly-hourbasis", text: "月給/時間別計算", unit: "円/月"}
] as const
const salaryTypeValues = salaryType.map(item => item.value)
export type SalaryTypeValueLiterals = typeof salaryTypeValues[number]

const transportationAllowance = [
  {value: "none", text: "なし"},
  {value: "per-day", text: "あり/日別計算"},
  {value: "fixed", text: "あり/月額固定"}
] as const
const transportationAllowanceValues = transportationAllowance.map(item => item.value)
export type TransportationAllowanceValueLiterals = typeof transportationAllowanceValues[number]

const countIn = [
  {value: "baseRate", text: "基本給", unit: "円/時"},
  {value: "overTime", text: "残業代", unit: "円/日"},
  {value: "transportation", text: "通勤手当", unit: "円/月"},
  {value: "travel", text: "出張手当", unit: "円/月"},
  {value: "meal", text: "食事手当", unit: "円/月"}
] as const
const countInValues = countIn.map(item => item.value)
export type CountInValueLiterals = typeof countInValues[number]

export const affiliation = [
  {value: "in-source", text: process.env.COMPANY_NAME, idMin: 10000, idMax: 19999, disabled: false, hidden: false},
  {value: "out-source", text: "外注先", idMin: 20000, idMax: 29999, disabled: true, hidden: false},
  {value: "system-developer", text: "システム開発者", idMin: 90000, idMax: 99999, disabled: false, hidden: true},
] as const
const affiliationValues = affiliation.map(item => item.value)
export type AffiliationValueLiterals = typeof affiliationValues[number]

const role = [
  {value: "admin", text: "社員/特権", disabled: false},
  {value: "general", text: "社員/一般", disabled: false},
  {value: "out-source", text: "外注先", disabled: true},
] as const
const roleValues = role.map(item => item.value)
export type RoleValueLiterals = typeof roleValues[number]

const options = {
  projectStatus,
  projectRequireWorkDetail,
  attendance,
  meals,
  salaryType,
  transportationAllowance,
  countIn,
  affiliation,
  role,
} as const


const params = {
  INITIAL_PROJECT_ID: 500,
  DEFAULT_REPORT_START_TIME: "08:00:00",
  DEFAULT_REPORT_END_TIME: "17:00:00",
  NIGHT_TIME_START: "22:00:00",
  NIGHT_TIME_END: "06:00:00",
  EXTRA_PAY_RATES: {
    regularWorkDuration: {
      hours: 0,
      days: 0,
      absent: 0,
      overTime: 1.25,
      nightTime: 1.5
    },
    holidayWorkDuration: {
      hours: 1.5,
      days: 0,
      absent: 0,
      overTime: 1.5,
      nightTime: 1.5
    },
  }
} as const

const initialState = {
  options,
  params,
}

const getState = () => initialState

const getters = getterTree(getState, {
  options: (state : typeof initialState) => state.options,
  params: (state : typeof initialState) => state.params,
})

const mutations = mutationTree(getState, {
  setIsSystemDeveloper(state : typeof initialState, bool : boolean) {
    //@ts-expect-error
    state.options.affiliation[2].disabled = false
  }
})

export default {
  state: getState,
  getters,
  mutations,
}