console.log("### firebase/modules/db.js")

import {
  getDatabase,
  ref as refOrig,
  child,
  query,
  orderByChild,
  orderByKey,
  orderByValue,
  equalTo,
  startAt,
  endAt,
  get,
  set,
  update,
  off,
  remove,
  push,
} from 'firebase/database'

import {
  getIdTokenResult
} from 'firebase/auth'

import axios from "axios"

import dayjs from 'dayjs'
import ja from 'dayjs/locale/ja'
dayjs.locale(ja)

import store from '@/store/index.js'

const devMode = process?.env.devMode ?? "prod"

const netlifyUrl = devMode === "dev" ? "http://localhost:8888"
               : devMode === "prod" ? `https://${process.env.FUNCTIONS_URL}`
               : devMode === "prev" ? `https://preview--${process.env.FUNCTIONS_URL}`
               : null
const fixedPath = "/.netlify/functions/"
const urlWithFixedPath = netlifyUrl + fixedPath

let ref

export default {
  initialize() {
    let db = getDatabase()
    ref = (path) => refOrig(db, path)

    /** Setup Maintenance window */
    return get(ref('/maintenance')).then(snapShot => {
      const data = snapShot.val()
      if( ! data) {
        data.isMaintenanceWindow = false
        data.duration = ""
      }
      if(store.getters.isMaintenanceWindow && ! data.isMaintenanceWindow)
        alert("メンテナンスが終了しました。")
      store.commit('isMaintenanceWindow', data.isMaintenanceWindow)
      store.commit('maintenanceDuration', data.duration)
    })
  },
  fetchOnsiteReport(projectId, startDate, endDate) {
    let myRef = ref(`/onsiteReport/${projectId}`)
    const constraints = [myRef, orderByKey()]

    if(startDate != null) {
      constraints.push(startAt(startDate))
    }
    if(endDate != null) {
      constraints.push(endAt(endDate))
    }
    let myQuery = query(...constraints)
    return get(myQuery).then(snapShot => snapShot.val())
  },
  fetchInhouseReport(fetchUnapprovedOnly, startDate, endDate, searchName, isDateExpanded) {
    let myRef = ref(`/inhouseReport`)
    let constraints = [myRef]
    if(fetchUnapprovedOnly) {
      constraints.push(orderByChild('approvedBy'), equalTo(""))
    } else if(startDate != null || endDate != null) {
      constraints.push(orderByChild('date'))

      if(startDate != null) {
        if(isDateExpanded) {
          startDate = dayjs(startDate).startOf("month").format('YYYY/MM/DD')
        }
        constraints.push(startAt(startDate))
      }
      if(endDate != null) {
        if(isDateExpanded) {
          endDate = dayjs(endDate).endOf("month").format('YYYY/MM/DD')
        }
        constraints.push(endAt(endDate))
      }
    } else if(searchName != null && searchName !== "") {
      constraints.push(orderByChild('name'), startAt(searchName), endAt(searchName + "\uf8ff"))
    }

    return get(query(...constraints)).then(snapShot => snapShot.val())
  },
  fetchInhouseReportWithReportId(reportId) {
    const myRef = ref(`/inhouseReport/${reportId}`)
    return get(myRef).then(snapShot => snapShot.val())
  },
  fetchUnreportedStaffList(yyyymmdd) {
    return axios.get(`${urlWithFixedPath}listUnreportedStaff?date=${yyyymmdd}`)
    .then(response => response?.data)
  },
  fetchProjectConfidential(projectId){
    const myRef = ref(`/projectConfidential/${projectId}`)
    return get(myRef).then(result => result.val())
  },
  fetchProject(projectId) {
    console.log(`projectId: ${projectId}`)
    const myRef = ref(`/project/${projectId}`)
    return get(myRef).then(snapShot => snapShot.val())
  },
  fetchProjectsWithWorkId(workId) {
    const constraints = [ref('/project'), orderByChild('workId'), equalTo(workId)]
    return get(query(...constraints)).then(snapShot => snapShot.val())
  },
  fetchProjectList(startOfMonth, endOfMonth) {
    const constraints = [ref('/project'), orderByChild('dateEnd'), startAt(startOfMonth)]
    return get(query(...constraints))
    .then(snapShot => {
      const projects = snapShot.val()
      if(projects == null)
        return projects
      const targetProjects = {}
      Object.keys(projects).forEach(projectId => {
        const project = projects[projectId]
        if(project.dateStart > endOfMonth)
          return
        targetProjects[projectId] = project
      })
      return targetProjects
    })
  },
  fetchTypeOptions(type) {
    let path = `/typeOptions/${type != null ? type : ""}`
    return get(ref(path)).then(snapShot => snapShot.val())
  },
  fetchWorkId(statusList) {
    return get(ref(`/workId/list`))
    .then(snapShot => {
      const val = snapShot.val()
      if(statusList == null) {return val}

      if(typeof statusList === "string") {
        statusList = [statusList]
      }

      Object.keys(val).forEach(workId => {
        if( ! statusList.includes(val[workId].status)) {
          delete val[workId]
        }
      })
      return val
    })
  },
  fetchWork(workId) {
    return get(ref(`/workId/list/${workId}`)).then(snapShot => snapShot.val())
  },
  fetchWorkIdProfiles() {
    return get(ref("/workId/profile")).then(snapShot => snapShot.val())
  },
  fetchLargestUserId(affiliation) {
    return get(ref(`/largestId/user/${affiliation}`)).then(snapShot => snapShot.val())
  },
  fetchLargestProjectId() {
    return get(ref('/project/largestProjectId')).then(snapShot => snapShot.val())
  },
  async fetchIncrementedLargestContractorId(type) {
    const myRef = ref(`/contractor/largestContractorId`)
    const data = await get(myRef).then(snapShot => snapShot.val())

    data[`${type}`] = Number.parseInt(data[`${type}`]) + 1
    console.log(`new Data: ${JSON.stringify(data)}`)
    update(myRef, data)
    return data
  },
  async fetchAuthInfo(staffId) {
    const authUser = store.getters.loginUser
    const idTokenResult = await getIdTokenResult(authUser)
    const authInfo = {}
    await axios.put(
      `${urlWithFixedPath}fetchAuthUser`,
      {
        uid: staffId
      },
      {
        headers: {
          authorization: idTokenResult.token
        },
      }
    ).then(response => {
      // console.log(`response: ${JSON.stringify(response)}`);
      authInfo.staffId = staffId
      authInfo.disabled = response.data.disabled
      authInfo.email = response.data.email
      authInfo.emailVerified = response.data.emailVerified
      authInfo.role = response.data.customClaims.role

      const test = []
      var creationTime = response.data.metadata.creationTime // format example: "Tue, 01 Dec 2020 01:19:49 GMT"
      if(creationTime) {
        creationTime = creationTime.split(" ").slice(1,5).join(" ")
        authInfo.creationTime = dayjs(creationTime, "DD MMM YYYY HH:mm:ss")
                              .add(9,'hour') // Converting GMT (+0:00) to JST (+9:00) 
                              .format("YYYY年MM月DD日 HH時mm分ss秒")
      }

      var lastSignInTime = response.data.metadata.lastSignInTime // format example: "Tue, 01 Dec 2020 01:19:49 GMT"
      console.log(`lastSignInTime: ${lastSignInTime}`);
      if(lastSignInTime) {
        lastSignInTime = lastSignInTime.split(" ").slice(1,5).join(" ")
        authInfo.lastSignInTime = dayjs(lastSignInTime, "DD MMM YYYY HH:mm:ss")
                              .add(9,'hour') // Converting GMT (+0:00) to JST (+9:00) 
                              .format("YYYY年MM月DD日 HH時mm分ss秒")
      }
    }, reason => {
      console.log(`Error: ${JSON.stringify(reason)}`);
      alert(`エラーが発生しました。\n${JSON.stringify(reason)}`)
    })
    return authInfo
  },
  fetchMyData(uid){
    return get(ref(`/staff/${uid}`)).then(snapShot => snapShot.val())
  },
  fetchStaffAll() {
    return get(ref('/staff')).then(snapShot => snapShot.val() ?? {})
  },
  fetchStaff(affiliation, name) {
    const constraints = [ref('/staff'), orderByChild('companyName')]
    return get(query(...constraints))
    .then(snapShot => {
      const staffList = {}
      const result = {}
      snapShot.forEach(child => {
        result[child.key] = child.val()
      })
      if( ! result)
        return staffList

      Object.keys(result).forEach(key => {
        if(affiliation && result[key].affiliation !== affiliation)
          return
        else if(name && ! result[key].staffName.includes(name))
          return
        staffList[key] = result[key]
      })
      return staffList
    })
  },
  fetchContractor(type, name) {
    const constraints = [ref(`/contractor`), orderByChild("type")]
    if(type !== "") {
      constraints.push(equalTo(type))
    }
    return get(query(...constraints))
    .then(snapShot => {
      const result = snapShot.val()
      if(result ==  null) {
        return result
      }
      delete result.largestContractorId
      if (name == null || name == "") {
        return result
      }
      console.log(`company name: ${name}`)
      Object.keys(result).forEach(key => {
        if( ! result[key].companyName.includes(name))
          delete result[key]
      })
      return result
    })
  },
  fetchTimesheet(from, to) {
    const constraints = [ref(`/timesheet`), orderByKey(), startAt(from), endAt(to)]
    return get(query(...constraints)).then(snapShot => snapShot.val())
  },
  fetchTimesheetParams() {
    return get(ref(`/params/timesheet`)).then(snapShot => snapShot.val())
  },
  fetchWorkIdsRequirePipeTracking(){
    const constraints = [ref("/workId/list"), orderByChild("shouldPipeTracked"), equalTo(true)]
    return get(query(...constraints)).then(snapShot => snapShot.val())
  },
  fetchPipesForWorkId(workId) {
    const constraints = [ref("pipeTracker"), orderByChild("workId"), equalTo(workId)]
    return get(query(...constraints)).then(snapShot => snapShot.val())
  },
  fetchSalesAndExpenses(
    // Args for search and analysis
    workIds, fromMonth, toMonth, 
    // Args specifically for search, can be ignored on analysis
    registeredAtFrom, registeredAtTo, category
  ) {
    let myRef = ref(`/salesAndExpenses`)
    let constraints1, constraints2 = [myRef]
    let promise
    if(fromMonth != null || toMonth != null) {
      constraints1.push(orderByChild('month'), startAt(fromMonth ?? '2000-01'), endAt(toMonth ?? '2099-12'))

      // if workId is not null, we throw two queries and merge them.
      let workId
      if(workIds != null) {
        workId = workIds[0]
      }
      if(workId) {
        constraints2.push(orderByChild('workId'), equalTo(workId))
        let data1, data2
        promise = Promise.all([
          get(query(...constraints1)).then(result => {
            data1 = result.val() ?? {}
          }),
          get(query(...constraints2)).then(result => {
            data2 = result.val() ?? {}
          }),
        ]).then(result => {
          // By combining two object,
          // duplicated keys will be overwritten by latter one,
          // which is expected.
          return Object.assign(data1, data2)
        })
      } else {
        promise = get(query(...constraints1)).then(snapShot => snapShot.val() ?? {})
      }
    } else if(workIds?.filter(v => v != null).length > 0) {
      promise = get(query(myRef, orderByChild('workId'), equalTo(workIds[0])))
      .then(snapShot => snapShot.val() ?? {})
    }
    if(promise == null) {
      promise = get(query(myRef, orderByChild('workId')))
      .then(snapShot => snapShot.val() ?? {})
    }

    return promise.then(result => {
      if(registeredAtFrom || registeredAtTo || category) {
        let resultArray = Object.entries(result)

        if(registeredAtFrom) {
          resultArray = resultArray.filter(([key, val]) => val?.registeredAt >= registeredAtFrom)
        }
        if(registeredAtTo) {
          resultArray = resultArray.filter(([key, val]) => val?.registeredAt <= registeredAtTo)
        }
        if(category) {
          resultArray = resultArray.filter(([key, val]) => {
            console.log(`val.category: ${val.category}`);
            return val?.category === category
          })
        }

        result = {}
        resultArray.forEach(([key, val]) => {
          result[key] = val
        })
      }
      return result
    })
  },
  listenFactorySchedule(ym, callback) {
    return get(ref(`/factorySchedule/${ym}`)).then(snapShot => callback(snapShot.val()))
  },
  detachListener(ym, listener) {
    return off(ref(`/factorySchedule/${ym}`))
  },
  fetchFactoryScheduleOnce(ym) {
    return get(ref(`/factorySchedule/${ym}`)).then(snapShot => snapShot.val())
  },
  saveFactorySchedule(ym, data) {
    return update(ref(`/factorySchedule/${ym}`), data)
  },
  approveInhouseReport(reportId, approverName) {
    return update(ref(`/inhouseReport/${reportId}`), {
      approvedBy: approverName
    })
  },
  deleteInhouseReport(reportId) {
    return remove(ref(`/inhouseReport/${reportId}`))
  },
  updateOnsiteReport(projectId, onsiteReport){
    return update(ref(`/onsiteReport/${projectId}`), onsiteReport)//.then(() => console.log('Successfully updated!'))
  },
  updateEmail(newEmail) {
    return store.getters.loginUser.updateEmail(newEmail)
  },
  async updateUser(updatedUser) {
    const authUser = store.getters.loginUser
    const idTokenResult = await getIdTokenResult(authUser)
    return axios.post(`${urlWithFixedPath}updateUser`,
      {
        updatedUser
      },
      {
        headers: {
          authorization: idTokenResult.token
        },
      })
      .then(response => {
        alert(`ユーザー情報の更新が完了しました。`);
      }, reason => {
        console.log(`Error: ${JSON.stringify(reason)}`);
        alert(`ユーザー情報の更新に失敗しました。\n${JSON.stringify(reason)}`)
      }
    )
  },
  async updateProject(mode, projectId, project, projectConfidential) {
    // Make sure to avoid projectId duplication on newly created project
    if(mode === 'new') {
      let projectIdDuplicated = false
      const projectData = await this.fetchProject(projectId)
      if(projectData !== null && projectData != {}) {
        projectIdDuplicated = true
      }

      if(projectIdDuplicated) {
        const projectList = await this.fetchProject('')
        const existingIdList = Object.keys(projectList)
        existingIdList.forEach(existingId => {
          if(existingId.match(/[0-9]*/) && projectId <= existingId)
            projectId = Number.parseInt(existingId) + 1
        })
        console.log(`### Warning: largestProjectId re-calculated to ${projectId}`)
      }
    }

    // The first update below seems to be redundant, but it is necessary to avoid the error:
    // "First argument contains a path /project that is ancestor of another path /project/largestProjectId"
    const updates = {
      [`/project/${projectId}`]: project, 
      ["/project/largestProjectId"]: projectId,
      [`/projectConfidential/${projectId}`]: projectConfidential,
    }

    // Simultaneous updates
    return update(ref() ,updates).then(result => {
      console.log(`project saved successfully!: ${JSON.stringify(result)}`)
      return result
    })
  },
  inactivateProject(projectId) {
    return update(ref(`/project/${projectId}`), {status: 'in-active'})
  },
  registerWork(work) {
    return update(ref(`/workId/list`), work).then(result => {
      console.log(`saved successfully!: ${JSON.stringify(result)}`);
    })
  },
  updateDbData(workId, unitId, materialType, estimatedDb, estimatedUnitPrice) {
    return update(ref(`/workId/list/${workId}/dbData/${unitId}/${materialType}`), {estimatedDb, estimatedUnitPrice})
  },
  updateWorkDateOf(workId, startOrEnd, dateString) {
    if( ! ['startAt', 'endAt'].includes(startOrEnd))
      return Promise.reject('Error: Invalid value for arg "startOrEnd"')
    return update(ref(`/workId/list/${workId}`), {[startOrEnd]:dateString})
  },
  deleteWorkId(workId) {
    return remove(ref(`/workId/list/${workId}`)).then(result => {
      console.log(`WorkId '${workId}' deleted successfully!: ${JSON.stringify(result)}`);
    })
  },
  updateSalesAndExpenses(data) {
    return update(ref(`/salesAndExpenses`), data)
  },
  registerSalesAndExpenses(data) {
    return push(ref(`/salesAndExpenses`), data)
  },
  registerContractor(contractor) {
    return update(ref(`/contractor`), contractor).then(result => {
      console.log(`saved successfully!: ${JSON.stringify(result)}`);
      return result
    })
  },
  async registerNewProfile(profile) {
    const myRef = ref(`/workId/profile`)
    const currentProfiles = await get(myRef).then(snapShot => snapShot.val())
    const childPath = Object.keys(currentProfiles).length.toString()

    return set(child(myRef, childPath), profile)
  },
  deleteSalesAndExpenses(id) {
    return remove(ref(`/salesAndExpenses/${id}`))
  },
  registerTimesheet(timesheetData) {
    // Passing timesheetData directly like firebase.database().ref(/timesheet).update(timesheetData)
    // will destroy the data already exists under /timesheet,
    // so instead we go with multiple-update strategy
    const updates = {}
    Object.keys(timesheetData).forEach(date => {
      Object.keys(timesheetData[date]).forEach(name => {
        Object.keys(timesheetData[date][name]).forEach(location => {
          Object.assign(updates, {
            [`/timesheet/${date}/${name}/${location}`]: timesheetData[date][name][location]
          })
        })
      })
    })
    return update(ref(), updates)
  },
  async registerUser(newUser) {
    const authUser = store.getters.loginUser
    const idTokenResult = await getIdTokenResult(authUser)
    return axios.post(`${urlWithFixedPath}registerUser`,
      {newUser},
      {
        headers: {
          authorization: idTokenResult.token
        },
      })
      .then(response => {
        alert(`ユーザーの登録が完了しました。`);
      }, reason => {
        console.log(`Error: ${JSON.stringify(reason)}`);
        alert(`新規ユーザーの登録に失敗しました。\n${JSON.stringify(reason)}`)
      }
    )
  },
  async deleteUser(uid) {
    const authUser = store.getters.loginUser
    const idTokenResult = await getIdTokenResult(authUser)
    return axios.post(`${urlWithFixedPath}deleteUser`,
      {uid: uid},
      {
        headers: {
          authorization: idTokenResult.token
        },
      })
      .then(response => {
        alert(`ユーザーの削除が完了しました。`);
      }, reason => {
        console.log(`Error: ${JSON.stringify(reason)}`);
        alert(`ユーザーの削除に失敗しました。\n${JSON.stringify(reason)}`)
      }
    )
  },
  async deleteTimesheetDataOn(selectedMonth) {
    const [year, month] = selectedMonth?.split('-')
    const firstDateOfMonth = dayjs().year(year).month(month - 1).date(1).format('YYYY-MM-DD')
    const lastDateOfMonth = dayjs().year(year).month(month).date(1).subtract(1, "days").format('YYYY-MM-DD')

    const myRef = ref('/timesheet')
    const constraints = [myRef, orderByKey(), startAt(firstDateOfMonth), endAt(lastDateOfMonth)]
    const result = await get(query(...constraints)).then(snapShot => snapShot.val())

    const datesToBeDeleted = {}
    Object.keys(result).forEach(date => {
      Object.assign(datesToBeDeleted, {[date]: null})
    })
    return update(myRef, datesToBeDeleted)
  },
  async addOrderDocument(workId, data) {
    const ref = firebase.database().ref(`/workId/list/${workId}/orderDocuments`)
    const result = await get(ref(`/workId/list/${workId}/orderDocuments`)).then(snapShot => snapShot.val())

    const existingArray = result ?? []
    existingArray.push(data)
    console.log(existingArray);
    return ref.set(existingArray)
  },
  async deleteOrderDocument(workId, url) {
    return get(ref(`/workId/list/${workId}/orderDocuments`))
    .then(snapShot => {
      const currentArray = snapShot.val()
      return ref.set(currentArray.filter(doc => doc.url !== url))
    })
  },
  async changeWorkStatus(workId, status) {
    return set(ref(`/workId/list/${workId}/status`), status)
  }
}