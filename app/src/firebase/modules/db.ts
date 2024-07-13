import {
  getDatabase,
  ref as refOrig,
  // child,
  query,
  orderByChild,
  // orderByKey,
  // orderByValue,
  equalTo,
  startAt,
  endAt,
  get,
  set,
  update,
  // off,
  onValue,
  onDisconnect,
  remove,
  push,
  limitToLast,
  enableLogging,
  DatabaseReference,
  serverTimestamp,
  DataSnapshot
} from 'firebase/database'
let ref : (path : string) => ReturnType<typeof refOrig>

import { to } from 'await-to-js'
import axios, {AxiosError, AxiosResponse} from "axios"
import dayjs from 'dayjs'
import ja from 'dayjs/locale/ja'
dayjs.locale(ja)

import {tstore} from '@/store/index'
import { $optionValueTo } from '@/ts/utils'
import auth from './auth'

import { Staff } from '@/schema/Staff'
import { StaffConfidential } from '@/schema/StaffConfidential'
import { FbAuthUser, FbCustomClaims } from '@/schema/FbAuthUser'
import type { AffiliationValueLiterals, ProjectStatusValueLiterals } from '@/store/modules/bundle'
import type { CreateUserRequestBody, } from '@/../../functions/src/schema/CreateUser.mts'
import type { FetchAuthUserRecordRequestBody, FetchAuthUserRecordResponse } from '@/../../functions/src/schema/FetchAuthUserRecord.mts'
import type { UpdateUserRequestBody, } from '@/../../functions/src/schema/UpdateUser.mts'
import type { DeleteUserRequestBody, } from '@/../../functions/src/schema/DeleteUser.mts'
import { Project } from '@/schema/Project'
import { Report } from '@/schema/Report'
import { Contact } from '@/schema/Contact'

const netlifyUrl = process.env.__COMMAND === "serve" ? "http://localhost:8888" : `https://${process.env.FUNCTIONS_URL}`

const fixedPath = "/.netlify/functions"
const urlWithFixedPath = netlifyUrl + fixedPath

export default {
  initialize() {
    let db = getDatabase()
    ref = (path : string) => refOrig(db, path)

    if (tstore.auth.uid != null) {
      this.fetchStaffById(parseInt(tstore.auth.uid))
      .then(staff => {
        tstore.pages.setDbUser(staff)
      })
    }

    /** Setup Maintenance window */
    return get(ref('/maintenance')).then(snapShot => {
      const data = snapShot.val()
      if( ! data) {
        data.isMaintenanceWindow = false
        data.duration = ""
      }
      if(tstore.pages.isMaintenanceWindow && ! data.isMaintenanceWindow) {
        alert("メンテナンスが終了しました。")
      }
      tstore.pages.setIsMaintenanceWindow(data.isMaintenanceWindow)
      tstore.pages.setMaintenanceDuration(data.duration)
    }).catch(error => {
      console.error(`Error: Failed to fetch maintenance status: ${error.message}`)
    })
  },
  setUpPresence() {
    const uid = tstore.auth.uid
    if( ! uid) {
      throw Error("Error: uid is nullish.")
    }
    const userStatusDatabaseRef = ref(`/status/${uid}`)
    const isOfflineForDatabase = {
      state: 'offline',
      last_changed: serverTimestamp(),
    };

    const isOnlineForDatabase = {
        state: 'online',
        last_changed: serverTimestamp(),
    };

    try {
      onValue(ref('.info/connected'), snapshot => {
        console.log(`--- online status: ${snapshot.val() ? "online" : "offline"}`);
        if (snapshot.val() == false) {
            return;
        };
        onDisconnect(userStatusDatabaseRef)
        .set(isOfflineForDatabase)
        .then(() => {
          console.log("--- seting offline trriger onDisconnect completed.");
          set(userStatusDatabaseRef, isOnlineForDatabase)
        }).catch((e) => {
          console.error("Warning: Failed to set onDisconnect() for presence (non-critical).", e)
        })
      })
    } catch (e) {
      console.error("Warning: Failed to set up presence (non-critical).", e)
    }
  },
  setFetchLatestVersionOfThisAppCallback(callback: (value: string) => void) {
    return onValue(ref('/version/latest'), snapShot => callback(snapShot.val()))
  },
  fetchContact() : Promise<Contact[]>{
    return get(query(ref("/contact"))).then(snapShot => snapShot.val())
  },
  searchStaff(affiliation : AffiliationValueLiterals, staffNameKeyWord? : string) : Promise<Staff[]> {
    const myRef = ref(`/staff`)
    return get(query(myRef, orderByChild("affiliation"), equalTo(affiliation)))
    .then(snapShot => {
      const staffObjs : Record<string, typeof Staff.prototype> = snapShot.val() ?? {}
      const staffArray = Object.entries(staffObjs).map(([docId, staffObj]) => new Staff(staffObj, docId))
      if(staffNameKeyWord == null || staffArray.length <= 0) {
        return staffArray
      }
      const tokens = staffNameKeyWord.split(/ |　|・/g)
      return staffArray.filter(staff => {
        return tokens.every(token => {
          return staff.staffNameNormalized.includes(token)
        })
      })
    })
  },
  fetchStaffById(staffId: typeof Staff.prototype.staffId) : Promise<Staff> {
    return get(ref(`/staff/${staffId}`))
    .then(snapShot => new Staff(snapShot.val(), staffId.toString()))
  },
  upsertStaff(docId: string|null|undefined, staffLike: Partial<Staff>) : Promise<void> {
    if( ! docId ) {
      return push(ref(`/staff`), staffLike).then()
    }
    return update(ref(`/staff/${docId}`), staffLike)
  },
  fetchStaffConfidential(staffId : number) : Promise<StaffConfidential> {
    return get(query(ref('/staffConfidential'), orderByChild("staffId"), equalTo(staffId)))
    .then(snapShot => {
      const result : Record<string, Partial<Staff>> = snapShot.val()
      if( ! snapShot.exists() || Object.is(result, {})) {
        return Promise.reject("Error: Result is empty.")
      }
      const mustBeArrayWithOneItem = Object.entries(result)
      const [docId, con] = mustBeArrayWithOneItem[0]
      return new StaffConfidential(con, docId)
    })
  },
  upsertStaffCofidential(docId: string|null|undefined, confidential : Partial<StaffConfidential>) : Promise<void> {
    if( ! docId) {
      return push(ref(`/staffConfidential`), confidential).then()
    }
    return update(ref(`/staffConfidential/${docId}`), confidential)
  },
  async fetchAuthUserAndCustomClaims(staffId : number) : Promise<{authUser: FbAuthUser, customClaims: FbCustomClaims}> {
    const body : FetchAuthUserRecordRequestBody = {
      uid: staffId.toString()
    }
    const idTokenResult = await auth.getIdTokenResult()
    const [error, response] = await to<AxiosResponse, AxiosError>(axios.put(
      `${urlWithFixedPath}/fetchAuthUserRecord`,
      body,
      {
        headers: {
          authorization: idTokenResult.token
        },
      }
    ))

    if(error) {
      console.log(`Error: ${JSON.stringify(error.message)}`,);
      Promise.reject(`エラーが発生しました。\n${JSON.stringify(error.message)}`)
    }

    const userRecord = response?.data as FetchAuthUserRecordResponse
    const customClaims = userRecord.customClaims as FbCustomClaims
    const authUser = new FbAuthUser(userRecord)

    let creationTime = userRecord.metadata.creationTime // format example: "Tue, 01 Dec 2020 01:19:49 GMT"
    if(creationTime) {
      creationTime = creationTime.split(" ").slice(1,5).join(" ")

      authUser.creationTime = dayjs(creationTime, "DD MMM YYYY HH:mm:ss")
      .add(9,'hour') // Converting GMT (+0:00) to JST (+9:00) 
      .format("YYYY年MM月DD日 HH時mm分ss秒")
    } else {
      authUser.creationTime = "(不明)"
    }

    let lastSignInTime = userRecord.metadata.lastSignInTime // format example: "Tue, 01 Dec 2020 01:19:49 GMT"
    console.log(`lastSignInTime: ${lastSignInTime}`);
    if(lastSignInTime) {
      lastSignInTime = lastSignInTime.split(" ").slice(1,5).join(" ")

      authUser.lastSignInTime = dayjs(lastSignInTime, "DD MMM YYYY HH:mm:ss")
      .add(9,'hour') // Converting GMT (+0:00) to JST (+9:00) 
      .format("YYYY年MM月DD日 HH時mm分ss秒")
    } else {
      authUser.lastSignInTime = "(不明)"
    }
    return {
      authUser,
      customClaims,
    }
  },
  async fetchNextStaffId(affiliation: string) {
    const maxIdPerAffiliation = $optionValueTo("affiliation", affiliation, "idMax")
    const minIdPerAffiliation = $optionValueTo("affiliation", affiliation, "idMin")
    console.log(`maxIdPerAffiliation: ${$optionValueTo("affiliation", affiliation, "idMin")}`);
    return get(query(ref("/staff"), orderByChild("staffId"), endAt(maxIdPerAffiliation), limitToLast(1)))
    .then(snapShot => {
      if(snapShot.exists()) {
        const result : Record<string, Partial<Staff>> = snapShot.val()
        const maxStaff = Object.values(result)[0]
        return new Staff(maxStaff).staffId + 1
      }
      return minIdPerAffiliation + 1
    })
  },
  async updateUser(requestBody : UpdateUserRequestBody) : Promise<any> {
    const idTokenResult = await auth.getIdTokenResult()
    return axios.post(`${urlWithFixedPath}/updateUser`,
      requestBody,
      {
        headers: {
          authorization: idTokenResult.token
        },
      }
    ).then(response => {
      if(requestBody.authUser.uid === tstore.auth.uid) {
        console.log(`Need to reset dbUser and authUser.`);
        tstore.pages.setDbUser(requestBody.staff)
        auth.refreshUser()
      }
      return response
    })
  },
  async createUser(newUser : CreateUserRequestBody) : Promise<any> {
    const idTokenResult = await auth.getIdTokenResult()
    return axios.post(`${urlWithFixedPath}/createUser`,
      newUser,
      {
        headers: {
          authorization: idTokenResult.token
        },
      }
    )
  },
  async deleteUser(staffId : typeof Staff.prototype.staffId) : Promise<void> {
    const requestBody : DeleteUserRequestBody = {
      uid: staffId.toString(),
    }
    const idTokenResult = await auth.getIdTokenResult()
    return axios.post(`${urlWithFixedPath}/deleteUser`,
      requestBody,
      {
        headers: {
          authorization: idTokenResult.token
        },
      }
    )
  },
  async fetchSafeConfidential(targetUid: number) {
    const params = new URLSearchParams({targetUid: targetUid.toString()})
    const idTokenResult = await auth.getIdTokenResult()

    /**
     * When using axios, test via vitest somehow drops headers
     * such as Authorization or Origin and they are not sent to server,
     * thus using fetch() here intentionally.
     */
    return fetch(`${urlWithFixedPath}/fetchSafeCredential?${params}`, {
      method: "GET",
      mode: "cors",
      cache: "no-cache",
      headers: {
        "Authorization": idTokenResult.token,
        "Origin": location.origin
      },
    }).then(async response => await response.json())
  },
  async fetchProjectsWithStatusFilter(statusList? : ProjectStatusValueLiterals[]) : Promise<Project[]> {
    return get(query(ref("project"), orderByChild("status")))
    .then(snapShot => Object.entries<Project>(snapShot.val() ?? {})
      .filter(([key, projectLike]) => statusList == null ? true : statusList.includes(projectLike.status))
      .map(([key, projectLike]) => new Project(projectLike, key))
      .toSorted((a,b) => a.projectId - b.projectId)
    )
  },
  async fetchNextProjectId() : Promise<number> {
    const maxProject = await get(query(ref("project"), orderByChild("projectId"), limitToLast(1)))
    .then(snapshot => {
      const result : Record<string, Partial<Project>> = snapshot.val()
      const projects = Object.values(result ?? {}).map(projectLike => new Project(projectLike))
      return projects[0]
    })
    return (maxProject?.projectId ?? tstore.bundles.params.INITIAL_PROJECT_ID) + 1
  },
  registerNewProject(projectLike: Partial<Project>) : Promise<DatabaseReference> {
    return push(ref("project"), projectLike).then(value => value)
  },
  updateProject(docId : string, projectLike: Partial<Project>) : Promise<void> {
    console.log(`typeof projectLike.projectId: ${typeof projectLike.projectId}`)
    return update(ref(`project/${docId}`), projectLike)
  },
  async deleteProject(projectId : number) : Promise<void> {
    const q = query(ref("project"), orderByChild("projectId"), equalTo(projectId))
    const keys = await get(q).then(snapshot => Object.keys(snapshot.val() ?? {}))

    if(keys.length <= 0) {
      throw Error("エラー：対象の工番は既に削除されています。")
    }
    return remove(ref(`/project/${keys[0]}`))
  },
  fetchReport(startDate : string, endDate : string, staffId?: string|number, affiliation: AffiliationValueLiterals = "in-source") : Promise<Report[]> {
    const key = staffId ? "staffIdWithDate" : "date"
    const start = staffId ? `${staffId}-${startDate}` : startDate
    const end = staffId ? `${staffId}-${endDate}` : endDate

    const q = query(ref(`report/${affiliation}`), orderByChild(key), startAt(start), endAt(end))
    return get(q).then(snapshot => {
      let reports = Object.entries<Report>(snapshot.val() ?? {})
      reports = ! staffId ? reports : reports.filter(([key, report]) => report.staffId == staffId)
      return reports.map(([key, report]) => new Report(report, key))
    })
  },
  registerNewReportList(reportArray : Partial<Report>[], affiliation: AffiliationValueLiterals = "in-source") : Promise<DatabaseReference[]> {
    if( ! Array.isArray(reportArray)) {
      throw Error("Error: arg you passed is not an array.")
    }

    const promises : Promise<DatabaseReference>[] = []
    reportArray.forEach(report => {
      promises.push(push(ref(`report/${affiliation}`), report).then(v=>v))
    })
    return Promise.all(promises)
  },
  deleteReport(reportId : string, affiliation: AffiliationValueLiterals = "in-source") : Promise<void> {
    return remove(ref(`report/${affiliation}/${reportId}`))
  },
}