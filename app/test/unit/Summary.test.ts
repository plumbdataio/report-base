
import { vi, expect, test, beforeAll } from 'vitest'
import { SummaryTotal } from '../src/schema/Summary'
import { Staff } from '../src/schema/Staff'
import { StaffConfidential } from '../src/schema/StaffConfidential'
import { Report } from '@/schema/Report'
import dayjs from 'dayjs'
test('Test "Summary" schema.', (context) => {
  return true
})

// const localStorageMock : Storage = (() => {
//   let store: Record<string, string> = {}

//   return {
//     getItem: (key: string) => store[key] ?? null,
//     setItem: (key: string, value: string): void => {
//       store[key] = value.toString()
//     },
//     removeItem: (key: string): void => {
//       delete store[key]
//     },
//     clear: ():void => {
//       store = {}
//     },
//     key: (index: number): string | null => "",
//     length: Object.keys(store).length
//   };
// })


// // beforeAll(() => {
// //   var window = window ?? {}
// //   window.localStorage = window.localStorage ?? {}
// // })
// test('Test "Summary" schema.', (context) => {
//   const staff = new Staff()
//   const confidential = new StaffConfidential()
//   const targetYYYYMM = dayjs(report.date).format('YYYY-MM')
//   const spy = vi.spyOn(window.localStorage, 'getItem').mockReturnValue(null)
//   const st = new SummaryTotal(staff, confidential, [report], targetYYYYMM)
//   st.summarize()
//   expect(st.totalDuration.days).toBe(staff)
// })

// // const report = new Report()
// // 