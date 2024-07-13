import dotEnv from 'dotenv'
dotEnv.config({path: '.env.vitest'})

import { describe, expect, test, vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'

import Vue from '@/ts/init_vue'
import router from '@/router'
import store from '@/store'

import ReportInputMine from '@/sfc/components/report-input-mine.vue'
import { Project } from '@/schema/Project'
import { Report, Work } from '@/schema/Report'
import { User, getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import cloneDeep from 'lodash/cloneDeep'

const authUser = JSON.parse(process.env.TEST_USER001 as string) as User
await signInWithEmailAndPassword(getAuth(), authUser.email!, process.env.TEST_USER001_PASSWORD as string)

const sleep = (time: number) => new Promise((resolve) => setTimeout(resolve, time));

const initialWork1 : Partial<Work> = {
  docId: undefined,
  projectId: 500,
  duration: "4:30:00",
  detail: "test work",
}

const initialWork2 : Partial<Work> = {
  docId: undefined,
  projectId: 8,
  duration: "03:00:00",
  detail: undefined,
}

const initialRerport : Partial<Report> = {
  docId: undefined,
  name: authUser.displayName!,
  nameNormalized: authUser.displayName!.replace(/ |　|・/g, ""),
  staffId: parseInt(authUser.uid),
  affiliation: "in-source",
  date: new Date(),
  staffIdWithDate: undefined,
  attendance: "regular-work",
  startTime: "08:00:00",
  endTime: "17:00:00",
  breakTime: "01:30:00",
  remarks: undefined,
  allowance: {
    breakfast: true,
    dinner: true,
    lunch: true,
    transportation: false,
    travel: true,
    projectId: 500,
  },
  works: [
    new Work(initialWork1),
    new Work(initialWork2),
  ],
  reportedBy: {
    id: "testuser001",
    name: "test user001"
  },
  reportedOn: new Date()
}

window.location.href = "http://localhost:5173"

describe('Prepare: check props of classes.', () => {
  test('props of initialWork1 covers all properties of Work class.', () => {
    const work1 = new Work(cloneDeep(initialWork1))
    expect(Object.keys(work1)).toMatchObject(Object.keys(initialWork1))
  })
  test('props of initialReport covers all properties of Report class.', () => {
    const report = new Report(cloneDeep(initialRerport))
    expect(Object.keys(report)).toMatchObject(Object.keys(initialRerport))
  })
})

describe('Component test: ReportInputMine', () => {

  const mountOption = {
    localVue: Vue,
    router,
    store,
    propsData: {
      projects: [new Project(), new Project(), new Project()]
    },
  }

  //@ts-expect-error
  let wrapper = mount(ReportInputMine, mountOption)

  const report0 = new Report(cloneDeep(initialRerport))
  report0.name += "-0"
  const report1 = new Report(cloneDeep(initialRerport))
  report1.name += "-1"
  report1.attendance = "absent"
  report1.works = []
  const report2 = new Report(cloneDeep(initialRerport))
  report2.name += "-2"
  report2.attendance = "absent"
  const report3 = new Report(cloneDeep(initialRerport))
  report3.name += "-3"
  report3.attendance = "dayoff"
  report3.works = []
  const report4 = new Report(cloneDeep(initialRerport))
  report4.name += "-4"
  report4.attendance = "dayoff"
  const report5 = new Report(cloneDeep(initialRerport))
  report5.name += "-5"
  report5.attendance = "paidoff"
  report5.works = []
  const report6 = new Report(cloneDeep(initialRerport))
  report6.name += "-6"
  report6.attendance = "paidoff"
  const report7 = new Report(cloneDeep(initialRerport))
  report7.name += "-7"
  report7.attendance = "site-off"
  report7.works = []
  const report8 = new Report(cloneDeep(initialRerport))
  report8.name += "-8"
  report8.attendance = "site-off"
  const report9 = new Report(cloneDeep(initialRerport))
  report9.name += "-9"
  report9.attendance = "holiday-work"
  const report10 = new Report(cloneDeep(initialRerport))
  report10.name += "-9"
  report10.attendance = "holiday-work"
  report10.works = []
  const report11 = new Report(cloneDeep(initialRerport))
  report11.name += "-9"
  report11.attendance = "half-paidoff"
  const report12 = new Report(cloneDeep(initialRerport))
  report12.name += "-9"
  report12.attendance = "half-paidoff"
  report12.works = []
  const report13 = new Report(cloneDeep(initialRerport))
  report13.name += "-9"
  report13.attendance = "compensatory-dayoff"
  const report14 = new Report(cloneDeep(initialRerport))
  report14.name += "-9"
  report14.attendance = "compensatory-dayoff"
  report14.works = []

  beforeAll(() => clearDbData())
  afterAll(() => clearDbData())

  describe.each([
    [report0], [report1], [report2], [report3], [report4], [report5], [report6], [report7], [report8], [report9]
  ])('expected to PASS: condition %#', (currentReport: Report) => {

    beforeAll(async () => {
      //@ts-expect-error
      wrapper = mount(ReportInputMine, mountOption)
      wrapper.setData({
        form: {
          report: currentReport
        }
      })
    })

    test("input for report.name is disabled", async () => {
      expect(wrapper.find("#input-name").attributes("disabled")).toBe("disabled")
    })

    test("travel and transport cannot be both true at the same time", async () => {
      const prevTravel = wrapper.vm.form.report.allowance.travel
      const prevTransportation = wrapper.vm.form.report.allowance.transportation

      wrapper.vm.form.report.allowance.travel = true
      wrapper.vm.form.report.allowance.transportation = true
      expect(wrapper.vm.$v.form.report.allowance.$invalid).toBe(true)

      wrapper.vm.form.report.allowance.travel = false
      wrapper.vm.form.report.allowance.transportation = false
      expect(wrapper.vm.$v.form.report.allowance.$invalid).toBe(false)

      wrapper.vm.form.report.allowance.travel = true
      wrapper.vm.form.report.allowance.transportation = false
      expect(wrapper.vm.$v.form.report.allowance.$invalid).toBe(false)

      wrapper.vm.form.report.allowance.travel = false
      wrapper.vm.form.report.allowance.transportation = true
      expect(wrapper.vm.$v.form.report.allowance.$invalid).toBe(false)

      wrapper.vm.form.report.allowance.travel = prevTravel
      wrapper.vm.form.report.allowance.transportation = prevTransportation
    })

    test('Report can pass all vuelidation', async () => {
      expect(wrapper.vm.$v.$invalid).toBe(false)
    })

    test('button is not disabled', async () => {
      expect(wrapper.find("#button-register").attributes("disabled")).not.toBe("disabled")
    })

    let refArray : Record<string, any>[] = []

    test('Report can be registered', async () => {
      const resultArray : [] = await wrapper.vm.register()
      /** the docId in resultArray above will be removed in next test's re-registration process. */
      // refArray?.push(...resultArray)
      // expect(Array.isArray(refArray)).toBe(true)

      await wrapper.vm.$nextTick
      const okButton1 = document.querySelector(".fortestonly-msgbox-footer-registration-completed")!.querySelector(".btn-primary")
      expect(okButton1?.textContent).toBe("OK")
      //@ts-expect-error
      await okButton1.click()
      await wrapper.trigger("keydown.esc")
      await wrapper.trigger("keydown.esc")
      await wrapper.vm.$nextTick()
    })

    test('Report can be re-registered', async () => {
      wrapper.vm.controls.selectedHistory = wrapper.vm.controls.history[0]
      await wrapper.vm.$nextTick()

      const okButton1 = document.querySelector(".fortestonly-msgbox-footer-before-copy")!.querySelector(".btn-primary")
      expect(okButton1?.textContent).toBe("OK")
      //@ts-expect-error
      await okButton1?.click()
      await wrapper.vm.$nextTick()
      await sleep(500)

      await wrapper.trigger("keydown.esc")
      // const okButton2 = document.querySelector(".fortestonly-msgbox-footer-copy-completed")!.querySelector(".btn-primary")
      // expect(okButton2?.textContent).toBe("OK")
      // await okButton2?.click()
      await wrapper.vm.$nextTick()

      expect(wrapper.find("#input-name").attributes("disabled")).toBe("disabled")

      const promise = wrapper.vm.register()
      await wrapper.vm.$nextTick()
      await sleep(500)

      const okButton3 = document.querySelector(".fortestonly-msgbox-footer-duplicated")!.querySelector(".btn-primary")
      expect(okButton3?.textContent).toBe("OK")
      //@ts-expect-error
      await okButton3?.click()
      await wrapper.vm.$nextTick()

      const footer4 = document.querySelector(".fortestonly-msgbox-footer-registration-failed")
      if(footer4 != null) {
        const okButton4 = footer4.querySelector(".btn-primary")
        expect(okButton4?.textContent).toBe("OK")
        //@ts-expect-error
        await okButton4?.click()
        return
      }

      const okButton5 = document.querySelector(".fortestonly-msgbox-footer-registration-completed")!.querySelector(".btn-primary")
      expect(okButton5?.textContent).toBe("OK")
      //@ts-expect-error
      await okButton5?.click()
      await wrapper.vm.$nextTick()

      const resultArray = await promise
      refArray?.push(...resultArray)
      expect(Array.isArray(refArray)).toBe(true)
      expect(refArray.length).above(0)
    })

    afterAll(async () => {
      if(refArray != null && Array.isArray(refArray)) {
        for(let ref of refArray) {
          const docId = ref.key
          await Vue.prototype.$firebase.db.deleteReport(docId)
          console.log(`TEST: deleted report: ${docId}`);
        }
      }
    })
  })
})

const clearDbData = async () => {
  const reports = await Vue.prototype.$firebase.db.fetchReport("2023/01/01", "2030/01/01", authUser.uid)
  for(let report of reports) {
    await Vue.prototype.$firebase.db.deleteReport(report.docId)
  }
}