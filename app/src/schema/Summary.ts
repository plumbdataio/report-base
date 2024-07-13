import cloneDeep from 'lodash/cloneDeep'
import dayjs from 'dayjs';
import duration, { Duration } from 'dayjs/plugin/duration'
dayjs.extend(duration)
import { saveAs } from 'file-saver'

import { tstore } from '@/store/index'
import { Report } from "@/schema/Report";
import { StaffConfidential, AllowanceCalcOption } from "@/schema/StaffConfidential";
import { $optionValueTo, getKeys } from '@/ts/utils';
import { Staff } from './Staff';
import { Project } from './Project';

let debug = true

type AllowanceOccurence = {
  calcOption: AllowanceCalcOption,
  rate: number,
}

const initialAllowance = {
  travel: [] as AllowanceOccurence[],
  breakfast: [] as AllowanceOccurence[],
  lunch: [] as AllowanceOccurence[],
  dinner: [] as AllowanceOccurence[],
  transportation: [] as AllowanceOccurence[],
} as const

const initialTotalDuration = {
  hours: {regular: 0, holiday: 0},
  days: {regular: 0, holiday: 0},
  absent: {regular: 0, holiday: 0},
  overTime: {regular: 0, holiday: 0},
  nightTime: {regular: 0, holiday: 0},
}

const workTypes = ["regular", "holiday"] as const

type SharedProps = {
  confidential : StaffConfidential,
  totalDuration: typeof initialTotalDuration,
  allowance : {[key: string]: AllowanceOccurence[]} & typeof initialAllowance,
}

export class SummaryTotal implements SharedProps {
  dbUser : Staff;
  reports : Report[];
  projectList : Project[];
  targetYYYYMM : string;
  confidential : SharedProps["confidential"];
  totalDuration : SharedProps["totalDuration"] = cloneDeep(initialTotalDuration)
  allowance : SharedProps["allowance"] = cloneDeep(initialAllowance);
  perProjects : SummaryPerProject[] = []

  constructor(dbUser : Staff, confidential : StaffConfidential, reports : Report[], projectList : Project[], targetYYYYMM : string) {
    this.dbUser = dbUser
    this.confidential = confidential
    this.reports = reports
    this.projectList = projectList
    this.targetYYYYMM = targetYYYYMM
  }

  async summarize() {
    console.log("started.");
    console.time("summarize")

    await this.#consumeReports()
    await this.#calcTotalHoursAndDays()
    await this.#exportToExcelTemplate()

    console.timeEnd("summarize")
    console.log("done.");
    console.log("---- Summarize -----");
    console.log(`this.total: ${JSON.stringify(this.totalDuration, null, 2)}`)
  }

  async #consumeReports() {
    const container: {[projectId: number]: SummaryPerProject} = {}
    this.reports.forEach(report => {
      if(report.attendance.match(/absent|paidoff|half-paidoff/)) {
        const projectId = $optionValueTo("attendance", report.attendance, "projectId")
        if( ! projectId ) {
          throw Error(`Error: projectId is nullish in 'tstore.bundle.options.attendance[index].projectId'`)
        }

        const projectTitle = $optionValueTo("attendance", report.attendance, "text") ?? "(プロジェクト名不明)"
        container[projectId] ??= new SummaryPerProject(projectId, projectTitle, this.confidential)
        container[projectId].consumeReport(report)

        if(report.attendance !== "half-paidoff") {
          return
        }
      }

      const relatedProjectIds = report.getRelatedProjectIds()
      relatedProjectIds.forEach(id => {
        const projectTitle = this.projectList.find(project => project.projectId === id)?.projectTitle ?? "(プロジェクト名不明)"
        container[id] ??= new SummaryPerProject(id, projectTitle, this.confidential)
        container[id].consumeReport(report)
      })
    })
    this.perProjects = Object.values(container)
  }

  #calcTotalHoursAndDays() {
    getKeys(this.totalDuration).forEach(segment => {
      workTypes.forEach(workType => {
        this.totalDuration[segment][workType] = this.perProjects.reduce((prev, perProject) => {
          return prev + perProject.totalDuration[segment][workType]
        }, 0)
      })
    })
  }

  async #exportToExcelTemplate() {
    //@ts-expect-error
    const {default: b64} = await import("@/assets/summary_template.xlsx?b64")
    const bin = atob(b64)
    const buffer = new Uint8Array(bin.length)
    for(let i = 0; i < bin.length; i++) {
      buffer[i] = bin.charCodeAt(i)
    }
    const Excel = await import("exceljs")
    const loader = new Excel.Workbook()
    const xlsxTemplate = await loader.xlsx.load(buffer)
    const targetSheetName = "テンプレート"
    const sheet = xlsxTemplate.getWorksheet(targetSheetName)
    if( ! sheet) {
      throw Error(`Error: Sheet '${targetSheetName}' is missing in template.`)
    }

    const headerStatic = {
      "L4": this.confidential.remarks,
      "B4": new Date().getFullYear() - 2018,
      "C4": new Date().getMonth(),
      "B5": this.dbUser.staffName,
      "B6": $optionValueTo("salaryType", this.confidential.salaryType),
      "B7": $optionValueTo("transportationAllowance", this.confidential.allowance.transportation.calcOption),
      "B8": this.confidential.workHours,
      "B9": this.confidential.breakHours,
      "B10": this.confidential.expectedOvertime,
      "B11": this.confidential.baseRate,
      "B12": this.confidential.allowance.transportation.calcOption !== "none" ? this.confidential.allowance.transportation.rate : "",
      "B13": this.confidential.allowance.travel.rate,
      "C14": this.confidential.allowance.breakfast.rate,
      "C15": this.confidential.allowance.lunch.rate,
      "C16": this.confidential.allowance.dinner.rate,
    } as const

    Object.entries(headerStatic).forEach(([k,v]) => {
      const cell = sheet.getCell(k)
      cell.value = v
      cell.alignment.shrinkToFit = true
    })

    const setValue = (rowOffsetStartFrom0: number, colOffsetStartFrom1: number, value: string|number) => {
      const cell = sheet.getCell(cursor.r + rowOffsetStartFrom0, cursor.c + colOffsetStartFrom1 - 1)
      cell.value = value
      cell.alignment.shrinkToFit = true
      return cell
    }

    const setValueCentered : typeof setValue = (rowOffsetStartFrom0, colOffsetStartFrom1, value) => {
      const cell = setValue(rowOffsetStartFrom0, colOffsetStartFrom1, value)
      cell.alignment.horizontal = "center"
      return cell
    }


    let cursor = {r: 4, c: 5}
    this.confidential.allowance.misc.forEach((misc, index) => {
      setValue(index, 1, misc.name)
      setValue(index, 3, misc.rate)
      setValue(index, 4, $optionValueTo("countIn", misc.countIn))
      setValue(index, 5, misc.remarks)
    })

    cursor = {r: 22, c: 1}
    this.perProjects.forEach((perProject, index) => {
      setValue(index, 1, perProject.projectTitle)
      setValue(index, 2, perProject.projectId)
      setValue(index, 4, perProject.totalDuration.hours.regular ?? "")
      setValue(index, 5, perProject.totalDuration.days.regular ?? "")
      setValue(index, 6, perProject.totalDuration.overTime.regular ?? "")
      setValue(index, 7, perProject.totalDuration.nightTime.regular ?? "")
      setValue(index, 8, perProject.totalDuration.hours.holiday ?? "")
      setValue(index, 9, perProject.totalDuration.days.holiday ?? "")
      setValue(index, 10, perProject.totalDuration.overTime.holiday ?? "")
      setValue(index, 11, perProject.totalDuration.nightTime.holiday ?? "")
      setValue(index, 14, perProject.allowance.transportation.length ?? "")
      setValue(index, 16, perProject.allowance.travel.length ?? "")
      setValue(index, 18, perProject.allowance.breakfast.length ?? "")
      setValue(index, 19, perProject.allowance.lunch.length ?? "")
      setValue(index, 20, perProject.allowance.dinner.length ?? "")
    })

    /** embedding reports */

    cursor = {r: 40, c: 1}
    const currentDate = dayjs(this.targetYYYYMM, {format: "YYYY-MM"}).startOf("month")
    const lastDateNum = currentDate.daysInMonth()
    for(let dateNum = 0; dateNum < lastDateNum; dateNum++) {
      setValue(dateNum, 1, currentDate.add(dateNum, "days").format("YYYY/MM/DD(ddd)"))
    }
    this.reports.forEach(report => {
      const rowOffset = dayjs(report.date).date() - 1
      setValueCentered(rowOffset, 2, $optionValueTo("attendance", report.attendance, "text"))
      setValueCentered(rowOffset, 3, getDayjsInstance(report.startTime).format("HH:mm"))
      setValueCentered(rowOffset, 4, getDayjsInstance(report.endTime).format("HH:mm"))
      setValueCentered(rowOffset, 5, report.allowance.transportation ? "●" : "")
      setValueCentered(rowOffset, 6, report.allowance.travel ? "●" : "")
      setValueCentered(rowOffset, 7, report.allowance.breakfast ? "●" : "")
      setValueCentered(rowOffset, 8, report.allowance.lunch ? "●" : "")
      setValueCentered(rowOffset, 9, report.allowance.dinner ? "●" : "")
      setValueCentered(rowOffset, 10, report.allowance.projectId)
      report.works.forEach((work, index) => {
        setValueCentered(rowOffset, 11 + index, work.projectId)
        setValueCentered(rowOffset, 12 + index, getDayjsInstance(work.duration).format("HH:mm"))
      })
      const remarksColOffset = Math.max(21,  10 + report.works.length*2)
      setValue(rowOffset, remarksColOffset, report.remarks)
    })

    const outputBuffer = await xlsxTemplate.xlsx.writeBuffer()
    saveAs(new Blob([outputBuffer]), `日報集計_${dayjs(this.targetYYYYMM, {format: "YYYY-MM"}).format("YYYY年MM月度")}_${this.dbUser.staffNameNormalized}.${dayjs().format("YYYY年MM月DD日_hh時mm分ss秒作成版")}.xlsx`)
  }
}

export class SummaryPerProject implements SharedProps {
  projectId : number;
  projectTitle : string;
  confidential : SharedProps["confidential"];
  totalDuration : SharedProps["totalDuration"] = cloneDeep(initialTotalDuration)
  allowance : SharedProps["allowance"] = cloneDeep(initialAllowance);

  constructor(projectId : number, projectTitle : string, confidential : StaffConfidential) {
    this.projectId = projectId
    this.projectTitle = projectTitle
    this.confidential = confidential
  }

  consumeReport(report : Report) {
    debug ? console.log(`DEBUG: ###############################`) : ""
    debug ? console.log(`DEBUG: ### Consuming report => this.projectId: ${this.projectId}, date: ${report.date.toLocaleString()}`) : ""

    if($optionValueTo("attendance", report.attendance, "projectId") === this.projectId) {
      this.totalDuration.days.regular
        += report.attendance === "absent"
        ? 1
        : report.attendance === "paidoff"
        ? 1
        : report.attendance === "half-paidoff"
        ? 0.5
        : 0
      return
    }

    if(report.allowance.projectId === this.projectId) {
      this.#consumeAllowanceFromReport(report.allowance)
    }

    this.#calcHoursAndDays(report)
  }

  #consumeAllowanceFromReport(reportedAllowance: typeof Report.prototype.allowance) {
    getKeys(reportedAllowance).forEach(allowanceType => {
      if(allowanceType === "projectId" || reportedAllowance[allowanceType] !== true) {
        return;
      }

      const calcBasis = this.confidential.allowance[allowanceType]
      switch (calcBasis.calcOption) {
        case "none": {
          break;
        }
        case "fixed": {
          throw Error("Error: Allowance claimed in report shouldn't have calcOption of 'fixed'.");
          break;
        }
        case "per-day": {
          this.allowance[allowanceType].push(calcBasis)
          break;
        }
        default: {
          throw Error(`Warn: Condition for this calculation option is not implemented: ${JSON.stringify(calcBasis)}`);
          break;
        }
      }
    })
  }

  #calcHoursAndDays(report: Report) {
    const totalHoursPerDay = report.works.reduce((total, work) => {
      return total + getDayjsInstance(work.duration).asHours()
    }, 0)

    const maxDays = report.attendance === "half-paidoff" ? 0.5 : 1
    const nominalTotalDays = Math.min(maxDays, totalHoursPerDay / this.confidential.workHours)
    debug ? console.log(`DEBUG: nominalTotalDays: ${nominalTotalDays}, totalHoursPerDay: ${totalHoursPerDay}, workHours: ${this.confidential.workHours}`) : ""

    const actualNightTimeTotal = this.#calcActualNightTime(report)
    const nominalOverTimeTotal = this.#calcNominalOverTime(report, actualNightTimeTotal)

    debug ? console.log(`DEBUG: actualNightTimeTotal: ${actualNightTimeTotal}, nominalOverTimeTotal: ${nominalOverTimeTotal}`) : ""

    report.works
    .filter(work => work.projectId === this.projectId)
    .forEach(work => {
      const totalHoursPerWork = getDayjsInstance(work.duration).asHours()
      const distributedRatio = totalHoursPerWork / totalHoursPerDay

      const nominalOverTime = nominalOverTimeTotal * distributedRatio
      const actualNightTime = actualNightTimeTotal * distributedRatio
      const hours = totalHoursPerWork - nominalOverTime
      const days = nominalTotalDays * distributedRatio
      debug ? console.log(`DEBUG: days: ${days}`) : ""

      const workType : typeof workTypes[number] = report.attendance === "holiday-work" ? "holiday" : "regular"
      this.totalDuration.overTime[workType] += nominalOverTime
      this.totalDuration.nightTime[workType] += actualNightTime
      this.totalDuration.hours[workType] += hours
      this.totalDuration.days[workType] += days
      debug ? console.log(`DEBUG: this[workType]: ${JSON.stringify(this.totalDuration)}`) : ""
    })
  }

  #calcActualNightTime(report: Report) : number {
    let {NIGHT_TIME_START, NIGHT_TIME_END} = tstore.bundles.params

    if(report.startTime < report.endTime && NIGHT_TIME_END <= report.startTime && report.endTime <= NIGHT_TIME_START) {
      debug ? console.log(`DEBUG: Pattern1: Regular work:  report.startTime: ${report.startTime}, report.endTime: ${report.endTime}`) : ""
      return 0
    }

    let nightTimeStartResult = dayjs.duration(0)
    let nightTimeEndResult = dayjs.duration(0)
    let isPlus24hToEndTimeNecessary = false

    if(report.endTime <= NIGHT_TIME_END && report.endTime < report.startTime) {
      debug ? console.log(`DEBUG: Pattern2:  report.startTime: ${report.startTime}, report.endTime: ${report.endTime}`) : ""
      isPlus24hToEndTimeNecessary = true
    } else if(report.endTime < report.startTime && report.startTime < NIGHT_TIME_START && NIGHT_TIME_END <= report.endTime) {
      debug ? console.log(`DEBUG: Pattern3: report.startTime: ${report.startTime}, report.endTime: ${report.endTime}`) : ""
      isPlus24hToEndTimeNecessary = true
    }

    const min = (a : string|Duration, b : typeof a) : string => {
      a = dayjs.isDuration(a) ? getOver24hString(a) : a
      b = dayjs.isDuration(b) ? getOver24hString(b) : b
      return a > b ? b : a;
    }
    const max = (a : string, b : string) => a > b ? a : b;

    if(isPlus24hToEndTimeNecessary) {
      const tempEndTime = getDayjsInstance(report.endTime).add(24, "hours")
      const tempNightTimeEnd = getDayjsInstance(NIGHT_TIME_END).add(24, "hours")

      nightTimeStartResult = getDayjsInstance(max(NIGHT_TIME_START, report.startTime))
      nightTimeEndResult = getDayjsInstance(min(tempNightTimeEnd, tempEndTime))
    } else if(NIGHT_TIME_START <= report.endTime) {
      debug ? console.log(`DEBUG: Pattern4: report.startTime: ${report.startTime}, report.endTime: ${report.endTime}`) : ""
      nightTimeStartResult = getDayjsInstance(max(NIGHT_TIME_START, report.startTime))
      nightTimeEndResult = getDayjsInstance(report.endTime)
    } else if(report.startTime <= NIGHT_TIME_END) {
      debug ? console.log(`DEBUG: Pattern5: report.startTime: ${report.startTime}, report.endTime: ${report.endTime}`) : ""
      nightTimeStartResult = getDayjsInstance(report.startTime)
      nightTimeEndResult = getDayjsInstance(min(NIGHT_TIME_END, report.endTime))
    } else {
      debug ? console.log(`DEBUG: Pattern6: report.startTime: ${report.startTime}, report.endTime: ${report.endTime}`) : ""
    }

    return nightTimeEndResult.subtract(nightTimeStartResult).as("hours")
  }

  /**
   * Calculate overtime not the one calculated straight-forward,
   * but the one subtracted the overwrapping times with nightTime.
   *
   * @param {Report} report
   * @param {number} nightTimeResult
   * @return {*}  {number}
   * @memberof SummaryPerProject
   */
  #calcNominalOverTime(report : Report, nightTimeResult : number) : number {
    const workHoursNum = this.confidential.workHours
    const breakHoursNum = this.confidential.breakHours
    let {NIGHT_TIME_START, NIGHT_TIME_END} = tstore.bundles.params
    let startTime = getDayjsInstance(report.startTime)
    let endTime = getDayjsInstance(report.endTime)

    if(report.startTime < NIGHT_TIME_END && NIGHT_TIME_END < report.endTime) {
      const nightTimeEnd = getDayjsInstance(NIGHT_TIME_END)
      const overTime = endTime.subtract(startTime).subtract(workHoursNum,"hours")
      return Math.max(overTime.subtract(nightTimeEnd).asHours(), 0)
    }
    if(report.endTime < report.startTime && NIGHT_TIME_END < report.endTime) {
      endTime = endTime.add(24, "hours")
      const nightTimeEnd = getDayjsInstance(NIGHT_TIME_END).add(24, "hours")

      const startOfOverTime = startTime.add(workHoursNum + breakHoursNum, "hours")
      if(getOver24hString(startOfOverTime) <= NIGHT_TIME_START) {
        return endTime.subtract(startOfOverTime).subtract(nightTimeResult, "hours").asHours()
      }
      return endTime.subtract(nightTimeEnd).asHours()
    }

    if(report.endTime < report.startTime) {
      endTime = endTime.add(24, "hours")
    }

    const breakHours = dayjs.duration(breakHoursNum, "hours")
    const workHoursDefault = dayjs.duration(workHoursNum, "hours")
    const workHoursResult = endTime.subtract(startTime).subtract(breakHours)
    const actualOverTime = workHoursResult.subtract(workHoursDefault).as("hours")

    return Math.max(actualOverTime - nightTimeResult, 0)
  }
}

const getDayjsInstance = (hhmmss: string) : Duration => {
  const [hh, mm, ss] = hhmmss.split(":").map(unit => parseInt(unit))
  return dayjs.duration({
    hours: hh,
    minutes: mm,
    seconds: ss,
  })
}
const getOver24hString = (duration: Duration) : string => {
  return Math.floor(duration.asHours()).toString().padStart(2, "0") + duration.format(":mm:ss")
}