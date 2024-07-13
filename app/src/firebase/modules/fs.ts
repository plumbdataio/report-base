// import {z} from 'zod'
import dayjs from 'dayjs'

import { Project } from '@/schema/Project'
import { Report } from '@/schema/Report'

import {
  initializeFirestore,
  getFirestore,
  doc,
  collection,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  loadBundle,
  where,
  and,
  or,
  orderBy,
  limit,
  count,
  endAt,
  endBefore,
  startAt,
  startAfter,
  query,
  serverTimestamp,
  sum,
  increment,
  CollectionReference,
  QueryFilterConstraint,
  DocumentReference,
  DocumentData,
  Firestore
} from 'firebase/firestore'
import { AffiliationValueLiterals, ProjectStatusValueLiterals } from '@/store/modules/bundle'
import { Staff } from '@/schema/Staff'

let app : Firestore

const fs = {
  initialize() {
    app = getFirestore()
  },
  async fetchProjectsWithStatusFilter(statusList? : ProjectStatusValueLiterals[]) : Promise<Project[]> {
    const myCollection = collection(app, "/project")
    const q = statusList == null || statusList.length === 0
      ? query(myCollection)
      : query(myCollection, where("status", "in", statusList))
    return getDocs(q).then(snapShot => snapShot.docs.map(d => new Project(d.data(), d.id)))
  },
  async fetchNextProjectId() : Promise<number> {
    const q = query(collection(app, "project"), orderBy("projectId", "desc"), limit(1))
    const maxProject = await getDocs(q)
    .then(snapshot => new Project(snapshot.docs[0].data()))
    return (maxProject?.projectId ?? 600) + 1
  },
  registerNewProject(projectLike: Partial<Project>) : ReturnType<typeof addDoc> {
    return addDoc(collection(app, "project"), projectLike)
  },
  updateProject(docId : string, projectLike: Partial<Project>) : Promise<void> {
    console.log(`typeof projectLike.projectId: ${typeof projectLike.projectId}`)
    return updateDoc(doc(app, `project/${docId}`), projectLike)
  },
  async deleteProject(projectId : number) : ReturnType<typeof deleteDoc> {
    const q = query(collection(app, "project"), where("projectId", "==", projectId))
    const docIds = await getDocs(q).then(snapshot => snapshot.docs.map(d => d.id))

    if(docIds.length === 0) {
      throw Error("エラー：対象の工番は既に削除されています。")
    }
    return deleteDoc(doc(app, "project", docIds[0]))
  },
  fetchReport(startDate : string, endDate : string, staffId?: string|number, affiliation: AffiliationValueLiterals = "in-source") : Promise<Report[]> {
    const constraints : ReturnType<typeof where>[]
      = [where("affiliation", "==", affiliation), where("date", ">=", startDate), where("date", "<=", endDate)]

    if(staffId) {
      constraints.push(where("staffId", "==", staffId))
    }

    const q = query(collection(app, "report"), ...constraints)
    return getDocs(q).then(snapshot => {
      return snapshot.docs.map(d => {
        return new Report(d.data() as Record<string, any>, d.id)
      })
    })
  },
  registerNewReportList(reportArray : Partial<Report>[]) : Promise<Awaited<ReturnType<typeof addDoc>>[]>{
    if( ! Array.isArray(reportArray)) {
      throw Error("Error: arg you passed is not an array.")
    }

    const promises : ReturnType<typeof addDoc>[] = []
    reportArray.forEach(report => {
      promises.push(addDoc(collection(app, "report"), report))
    })

    return Promise.all(promises)
  },
  deleteReport(reportId : string) : ReturnType<typeof deleteDoc> {
    return deleteDoc(doc(app, "report", reportId))
  },
}

export default fs