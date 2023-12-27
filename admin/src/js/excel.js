import XlsxPopulate from 'xlsx-populate/browser/xlsx-populate-no-encryption.js'
import { saveAs } from 'file-saver'

import $firebase from '@/firebase/index.js'

import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
dayjs.extend(duration)

import cloneDeep from 'lodash/cloneDeep'

const extractSheetName = async (fileAsArrayBuffer) => {
  const workBook = await XlsxPopulate.fromDataAsync(fileAsArrayBuffer)
  return workBook.sheets().map(sheet => sheet.name())
}

const fillTemplate = async (fileAsArrayBuffer, fileNameOrig, companyName, sheetNames, year, month) => {
  const workBook = await XlsxPopulate.fromDataAsync(fileAsArrayBuffer)
 
  const paramsList = []
  let timesheetParams = (await $firebase.db.fetchTimesheetParams())
    ?.filter(p => companyName === p.companyName) ?? []

  sheetNames.forEach(sheetName => {
    const params = cloneDeep(timesheetParams.find(p => p.sheetName === sheetName) ?? timesheetParams.find(p => p?.isAcceptAnonymouseSheetName))
    if(params == null) {
      throw Error("Couldn't find suitable timesheet params.")
    }
    params.sheetName = sheetName
    paramsList.push(params)
  })

  // Fetch timesheet data
  let timesheets = await fetchAndMerge(year, month)
  let outputWorkbook = workBook
  for(let i = 0; i < paramsList.length; i++) {  // Intentionally using for() clause to "await"
    outputWorkbook = await manipulateWorkbook(timesheets, outputWorkbook, paramsList[i])
  }
  // return if nothing has been changed
  // if(outputWorkbook === workBook) return
  await outputWorkbook.outputAsync().then(result => {
    const modifiedFileName = fileNameOrig.replace('.xlsx', `_ver${dayjs().format('YYMMDD_HHmmss')}.xlsx`)
    saveAs(result, modifiedFileName)
  })
}

const extractData = (file, location, type) => {
  if(type === 'alsok') {
    loadAlsok(file, location)
  } else if (type === "fingerprint") {
    loadFingerPrint(file, location)
  } else {
    alert("エラー：該当の拠点に、有効な勤怠システムタイプが設定されていません。システム管理者にお問い合わせ下さい。")
  }
}

const loadAlsok = function(file, location) {
  let reader = new FileReader()
  reader.onload = () => {
    const json = {}
    const rawCsv = reader.result.split('\r\n');
    rawCsv.shift() // To remove header raw
    rawCsv.forEach(row => {
      row = row.split(',')
      if(row.length < 6)
        return

      const dateArray = row[0].split('/')
      const date = dayjs().year(Number.parseInt(dateArray[0]))
                          .month(Number.parseInt(dateArray[1]) - 1) // Make sure to minus 1
                          .date(Number.parseInt(dateArray[2]))
                          .format('YYYY-MM-DD')
      const time = dayjs().hour(Number.parseInt(row[1].split(':')[0]))
                          .minute(Number.parseInt(row[1].split(':')[1]))
                          .format('HH:mm')
      const id = row[3]
      const name = row[4].split(/ |　|・/).join('')

      if(json[date] === undefined)
        json[date] = {}
      if(json[date][name] === undefined)
        json[date][name] = {}
      if(json[date][name][location] === undefined) {
        json[date][name][location] = {
          registrationTimestamp: dayjs().format('YYYY/MM/DD HH:mm:ss'),
          filledBy: "loaded-from-file",
          id: id,
          time: [time]
        } 
      } else {
        json[date][name][location].time.push(time)
        json[date][name][location].time.sort()
      }
    })
    console.log(`result: ${JSON.stringify(json)}`);
    $firebase.db.registerTimesheet(json)
    .then(result => {
      alert(`タイムシートの登録に成功しました。`)
    })
  }
  reader.readAsText(file)
}

const loadFingerPrint = function(file, location) {
  let reader = new FileReader()
  reader.onload = () => {
    XlsxPopulate.fromDataAsync(reader.result)
    .then(workBook =>{
      const sheetName = "出席記録"
      const idColPos = 3
      const nameColPos = 11
      // const departmentColPos = 21
      const termRowPos = 3
      const termColPos = 3
      const termSeparator = '-'
      const firstEntryRowPos = 5
      const totalEntry = 200
      const json = {}
      let row, col, id, name

      // parse term
      const sheet = workBook.sheet(sheetName)
      const term = sheet.row(termRowPos).cell(termColPos).value() // format example: YYYY-MM-DD ～ YYYY-MM-DD
      console.log(`term: ${term}`)
      const termStart = term.split(' ')[0]
      const termEnd = term.split(' ')[2]
      if((termStart === undefined || termStart === null)
        || (termEnd === undefined || termEnd === null))
        return alert('期間の取得に失敗しました。\nデータ読み取りを中止します。')
      const termStartArray = termStart.split(termSeparator)
      const termEndArray = termEnd.split(termSeparator)
      let termStartDayjs = dayjs().year(Number.parseInt(termStartArray[0]))
                                  .month(Number.parseInt(termStartArray[1]) - 1) // Make sure to minus 1
                                  .date(Number.parseInt(termStartArray[2]))
      const lastRowPos = sheet.usedRange().endCell().rowNumber()
      for(let rowCursor = firstEntryRowPos; rowCursor <= lastRowPos; rowCursor++) {
        row = sheet.row(rowCursor)

        // Parse staff information
        id = row.cell(idColPos).value()
        id = id instanceof Object ? id.text() : id
        name = row.cell(nameColPos).value()
        name = (name instanceof Object ? name.text() : name)?.toString()
        if(name == null || name === "") {
          rowCursor++
          continue
        }
        if(name != null && typeof name === "string") {
          try {
            name = name?.split(/ |　|・/).join('')
          } catch(e) {
            console.log(e);
            console.log(`name: ${name}, id: ${id}`);
          }
        } else {

        }

        // Next row
        row = sheet.row(++rowCursor)
        for(let colCursor = 1; colCursor <= 31; colCursor++) {
          let time = row.cell(colCursor).value()
          time = time instanceof Object ? time.text() : time
          if(time === undefined || time === "")
            continue;
          let timeArray
          try {
            timeArray = time.split('')
          } catch (error) {
            alert(`警告：データ不備があります。\n以下のデータは取り込まれませんでした。\n名前: ${name}, 日付: ${colCursor}日`)
            console.log(colCursor)
            console.log(name)
            console.log(typeof time);
            continue;
          }
          const timeList = []
          for(let i = 0; i < timeArray.length;) {
            timeList.push(timeArray[i++] + timeArray[i++] + timeArray[i++] + timeArray[i++] + timeArray[i++])
          }

          const termCursor = termStartDayjs.add(Number.parseInt(colCursor-1), 'days')
                                           .format('YYYY-MM-DD')

          let conditionedLocation = location
          if(location === "yamada" && termCursor <= "2021-09-17") {
            conditionedLocation = "shione"
          }

          if(json[termCursor] === undefined)
            json[termCursor] = {}

          if(json[termCursor][name] === undefined)
            json[termCursor][name] = {}

          json[termCursor][name][conditionedLocation] = {
            registrationTimestamp: dayjs().format('YYYY/MM/DD HH:mm:ss'),
            filledBy: "loaded-from-file",
            id: id,
            time: timeList
          }
        }
      }
      $firebase.db.registerTimesheet(json)
              .then(result => {
                alert(`タイムシートの登録に成功しました。`)
              })
    })
  }
  reader.readAsArrayBuffer(file)
}

// Fetch timesheet(originally from excel files) and onsite report(originally from web form)
// then merge them into  object 
const fetchAndMerge = async function(year, month) {
  const startDate = dayjs().year(year).month(parseInt(month)-1).startOf('month').format('YYYY-MM-DD')
  const endDate = dayjs().year(year).month(parseInt(month)-1).endOf('month').format('YYYY-MM-DD')
  let alertMessage = null
  let projectList = {}
  await $firebase.db.fetchProjectList(startDate, endDate)
  .then(async data => {
    if(data != null)
      projectList = data
  })
  .catch(error => {
    alertMessage = `エラー：プロジェクトIDの取得に失敗しました。`
  })
  if(alertMessage != null)
    return alert(alertMessage)

  let staffList = {}
  await $firebase.db.fetchStaffAll()
  .then(data => {
    if(data != null)
      staffList = data
  })
  .catch(error => {
    alertMessage = `エラー：スタッフIDの取得に失敗しました。`
  })
  if(alertMessage != null)
    return alert(alertMessage)
  
  const mergedData = {}
  const unresolvedStaffIds = []
  // For the onsite report, we need
  for(const [projectId, projectData] of Object.entries(projectList)) {
    const reports = await $firebase.db.fetchOnsiteReport(projectId, startDate, endDate)
    if(reports == null || reports == {}) {
      continue;
    }

    const siteName = projectData?.siteName ?? "現"

    Object.keys(reports).forEach(date => {
      if(date < startDate || endDate < date) {
        console.log(`Passed ${date}`);
        return
      }

      // Retrieve staffName from staffId and add it to each report
      Object.keys(reports[date]).forEach(staffId => {
        const report = reports[date][staffId]

        Object.keys(staffList).some(staffIdRef => {
          if(staffId === staffIdRef) {
            report.staffName = staffList[staffIdRef].staffName
            report.affiliation = staffList[staffIdRef].affiliation
            return true
          }
        })

        if(report.staffName == null) {
          unresolvedStaffIds.push(staffId)
        }
        if(report.type === ""){
          return
        }

        report.siteName = siteName

        let staffName = report.staffName.split(/ |　|・|\r\n|\n/).join('')
        if(mergedData[staffName] == null) {
          mergedData[staffName] = {}
        }
        
        mergedData[staffName][date] = {
          in_location: report?.type === "holiday" ? "公休" : report.siteName,
          in_time: "",
          out_location: report?.type === "holiday" ? "公休" : report.siteName,
          out_time: "",
          // These are additional data only for onsite report
          basehour: projectData.manhourBasehour == null
                    || projectData.manhourBasehour === ""
                    ? 8.0
                    : parseFloat(projectData.manhourBasehour),
          report: report
        }
      })
    })
  }
  if(unresolvedStaffIds.length > 0) {
    unresolvedStaffIds.sort()
    return alert(`エラー：以下のスタッフIDに対応するスタッフ名がみつかりませんでした。\n${JSON.stringify(Array.from(new Set(unresolvedStaffIds)))}`)
  }

  console.log(`fetchTimesheet of startDate: ${startDate}, endDate: ${endDate}`);
  const timesheetRaw = await $firebase.db.fetchTimesheet(startDate, endDate) ?? {}
  console.log(`data fetched`);

  // Convert data structure and add it to time
  Object.keys(timesheetRaw).forEach(date => {
    Object.keys(timesheetRaw[date]).forEach(nameOnTimesheet => {
      Object.keys(timesheetRaw[date][nameOnTimesheet]).forEach(location => {
        // Create base structure of converted data
        if(mergedData[nameOnTimesheet] == null)
          mergedData[nameOnTimesheet] = {}
        if(mergedData[nameOnTimesheet][date] == null)
          mergedData[nameOnTimesheet][date] = {
            in_location: "",
            in_time: "",
            out_location: "",
            out_time: ""
          }
        else if(mergedData[nameOnTimesheet][date].report != null) {
          if(mergedData[nameOnTimesheet][date].error == null) {
            mergedData[nameOnTimesheet][date].error = ""
          }
          mergedData[nameOnTimesheet][date].error += "データの重複があります。"
          // console.log(`### Duplicated data: ${JSON.stringify(mergedData[nameOnTimesheet][date])}`);
        }

        // Time comparison between raw data
        const timeContainer = mergedData[nameOnTimesheet][date]
        const timeArray = timesheetRaw[date][nameOnTimesheet][location].time
        if(timeArray == null) {
          console.log(`timeArray === null : date === ${date}, name === ${nameOnTimesheet}, ${JSON.stringify(timesheetRaw[date][nameOnTimesheet][location])}`)
        }
        if(timeArray.length === 1) {
          if(timeArray[0] < '12:00' && (timeContainer.in_time === "" || timeContainer.in_time > timeArray[0])) {
            timeContainer.in_time = timeArray[0]
            timeContainer.in_location = location
          } else if(timeArray[0] >= '12:00' && (timeContainer.out_time === "" || timeContainer.out_time < timeArray[0])) {
            timeContainer.out_time = timeArray[0]
            timeContainer.out_location = location
          } else {
            const errorMessage = `処理できなかったデータがあります。\nname=${nameOnTimesheet}, date=${date}, timeArray:${timeArray[0]}, timeContainer: ${JSON.stringify(timeContainer)}`
            timeContainer.error == null ? timeContainer.error = errorMessage : timeContainer.error += errorMessage
            console.log(`unhandled... : ${errorMessage}`)
          }
        } else if (timeArray.length > 1){
          timeArray.sort()
          const earliestTime = timeArray.shift()
          const latestTime = timeArray.pop()
          if(timeContainer.in_time === "" || timeContainer.in_time > earliestTime) {
            timeContainer.in_time = earliestTime
            timeContainer.in_location = location
          }
          if(timeContainer.out_time === "" || timeContainer.out_time < latestTime) {
            timeContainer.out_time = latestTime
            timeContainer.out_location = location
          }
        }
      })
    })
  })
  // console.log(`mergedData: ${JSON.stringify(mergedData)}`)
  return mergedData
}

const manipulateWorkbook = async function(timesheets, workBook, params) {
  const sheet = workBook.sheet(params.sheetName)
  if(sheet == null) {
    alert(`「${params.sheetName}」という名前のシートが見つかりませんでした。`)
    return workBook
  }
  
  const typeOption = {
    "regular": {translation: "出", lateNight: "" },
    "half-paidoff": {translation: "0.5", lateNight: "半休"},
    "holiday": {translation: "公休", lateNight: ""},
    "paidoff": {translation: "", lateNight: "有休"},
    "absence": {translation: "", lateNight: "欠勤"},
    "transfer": {translation: "出", lateNight: "移動"}
  }

  const workplaces = await $firebase.db.fetchTypeOptions("workplace")

  let lastRowPos = sheet.usedRange().endCell().rowNumber()
  const usedRangeValueArray2d = sheet.usedRange().value()

  const maxEmptyRows = 100
  let emptyRowCounter = 0
  usedRangeValueArray2d?.some((rowValue, index) => {

    const isRowEmpty = rowValue.some(cellValue => cellValue != null && cellValue !== "")
    emptyRowCounter = isRowEmpty ? 0 : emptyRowCounter + 1

    if(emptyRowCounter >= maxEmptyRows) {
      lastRowPos = (index + 1) - emptyRowCounter
      return true
    }
  })
  console.log(`lastRow of sheet "${params.sheetName}": ${lastRowPos}`);

  let extraMovement = 0
  let staffCount = 1
  let rowCursor = 1
  // Start manipulation
  for(rowCursor += params.headerGap; rowCursor <= lastRowPos; rowCursor += extraMovement) {
    // console.log(`searched row: ${rowCursor}, staffCount: ${staffCount}`);
    if(staffCount > params.maxStaffCount) {
      staffCount = 1
      extraMovement = params.headerGap + params.footerGap
      continue
    }

    // continue if name doesn't match
    staffCount++
    extraMovement = params.entryGap
    let nameOnExcel = sheet.row(rowCursor + params.nameGap)
                              .cell(params.nameColPos)
                              .value()

    if(nameOnExcel === null || nameOnExcel === undefined || nameOnExcel === "")
      continue;
    nameOnExcel = nameOnExcel.split(/ |　|・|\r\n|\n/).join('')
    if(timesheets[nameOnExcel] == null)
      continue

    const firstSiteNameCell = sheet.row(rowCursor + params.siteNameGap).cell(params.firstEntryColPos)
    const lastSiteNameCell = sheet.row(rowCursor + params.siteNameGap).cell(params.firstEntryColPos+30)
    const siteNameRange = firstSiteNameCell.rangeTo(lastSiteNameCell)
    siteNameRange.merged(false)
    siteNameRange.style({
      "horizontalAlignment": "left",
      "wrapText": false,
      "shrinkToFit": false,
    })

    // console.log(`nameOnExcel: "${nameOnExcel}", ${rowCursor}`);

    // Dig data
    const personalTimesheet = timesheets[nameOnExcel]

    Object.keys(personalTimesheet).forEach(date => {
      let status = "出"
      const needsAttentionStatus = "●"

      // To determine if overtime is long or not,
      // examin the setting applied to entire sheet first,
      // then if necessary, examin each entry in excel file.
      const isLongOvertimePeriod = params.longOvertimePeriodForEntireSheet
                                  ? true
                                  : sheet.row(rowCursor + params.flagGap)
                                    .cell(params.longOvertimePeriodFlagColPos)
                                    .value() === params.longOvertimePeriodFlag
      // Determine if break time is short(===true) or not(===false)
      const isShortBreaker = sheet.row(rowCursor + params.flagGap)
                            .cell(params.shortBreakerFlagColPos)
                            .value() === params.shortBreakerFlag
      const currentColPos = params.firstEntryColPos - 1 + Number.parseInt(date.split('-')[2])
      // console.log(`currentColPos: ${currentColPos} = params.firstEntryColPos ${params.firstEntryColPos} + date.split('-')[2] ${date.split('-')[2]}`);
      const timeContainer = personalTimesheet[date]
      const regularDuration = isShortBreaker ? '07:30':'07:00'
      let duration = dayjs.duration(0)
      let overTimeDuration = dayjs.duration(0)
      if(timeContainer.in_time !== "" && timeContainer.out_time !== "") {
        let inTimeArray = timeContainer.in_time.split(':')
        let outTimeArray = timeContainer.out_time.split(':')
        // 1. round up the in-time and round down the out-time
        // - In time
        if(inTimeArray[0] < 7) {
          // If it's too early like before 7:00, there might be any reason
          // and return error to promote further investigation
          status = needsAttentionStatus
        } else if(inTimeArray[0] < 8 || timeContainer.in_time === params.regularInTime) {
          // in-time before 8:00 should be rounded up to 8:00
          inTimeArray = params.regularInTime.split(':')
        } else { // meaning being late !!!
          status = needsAttentionStatus
          // Round up
          inTimeArray[1] = inTimeArray[1] <= 15 ? 15
                          : inTimeArray[1] <= 30 ? 30
                          : inTimeArray[1] <= 45 ? 45
                          : 0
          // Add 1 hour if rounded up to 0
          if(inTimeArray[1] === 0 ) {
            inTimeArray[0] = parseInt(inTimeArray[0]) + 1
          }
        }
        // - Out time
        if(timeContainer.out_time < params.regularOutTime ) {
          status = needsAttentionStatus
        } else if(isLongOvertimePeriod) {
          outTimeArray[1] = outTimeArray[1] >= 30 ? 30
                          : 0
        } else {
          outTimeArray[1] = outTimeArray[1] >= 45 ? 45
                          : outTimeArray[1] >= 30 ? 30
                          : outTimeArray[1] >= 15 ? 15
                          : 0
        }

        // 2. calculate whole duration
        duration = duration.add(parseInt(outTimeArray[0]), 'h')
                            .add(parseInt(outTimeArray[1]), 'm')
                            .subtract(parseInt(inTimeArray[0]), 'h')
                            .subtract(parseInt(inTimeArray[1]), 'm')

        // 3. calculate break time
        params.breakTimeList.forEach(breakTime => {
          // shortBreaker has less break time, literally
          if(breakTime.notForShortBreaker && isShortBreaker)
            return
          if(timeContainer.in_time <= breakTime.start
              && timeContainer.out_time >= breakTime.end) {
            duration = duration.subtract(parseInt(breakTime.durationAsArray[0]), 'h')
                                .subtract(parseInt(breakTime.durationAsArray[1]), 'm')
          }
        })

        // 4. calculate overtime
        const regularDurationArray = regularDuration.split(':')
        overTimeDuration = duration.subtract(Number.parseInt(regularDurationArray[0]), 'h')
                                   .subtract(Number.parseInt(regularDurationArray[1]), 'm')
                                   .asHours()
        overTimeDuration = overTimeDuration <= 0 ? "" : overTimeDuration
        status = overTimeDuration === needsAttentionStatus ? needsAttentionStatus : status
      } else {
        status = needsAttentionStatus
      }

      // Define target cells
      const statusCell = sheet.row(rowCursor + params.statusGap).cell(currentColPos)
      const overTimeCell = sheet.row(rowCursor + params.overTimeGap).cell(currentColPos)
      const lateNightCell = sheet.row(rowCursor + params.lateNightGap).cell(currentColPos)
      const bentoCell = sheet.row(rowCursor + params.bentoGap).cell(currentColPos)
      const inLocationCell = sheet.row(rowCursor + params.inLocationGap).cell(currentColPos)
      const inTimeCell = sheet.row(rowCursor + params.inTimeGap).cell(currentColPos)
      const outLocationCell = sheet.row(rowCursor + params.outLocationGap).cell(currentColPos)
      const outTimeCell = sheet.row(rowCursor + params.outTimeGap).cell(currentColPos)
      const remarksCell = sheet.row(rowCursor + params.remarksGap).cell(currentColPos)
      const siteNameCell = sheet.row(rowCursor + params.siteNameGap).cell(currentColPos)

      // Before fill the cell, check if the value already exists
      let remarksMessage = null
      if(statusCell.value() != null || overTimeCell.value() != null || lateNightCell.value() != null) {
        status = needsAttentionStatus
        const duplicatedStatus = statusCell.value() == null ? "" : statusCell.value()
        const duplicatedOvertime = overTimeCell.value() == null ? "" : overTimeCell.value()
        const duplicatedLatenight = lateNightCell.value() == null ? "" : lateNightCell.value()
        remarksMessage = `●既にあったデータを上書きしました。元データ：工=>"${duplicatedStatus}", H=>"${duplicatedOvertime}", "SH=>${duplicatedLatenight}"`
        remarksCell.value(remarksCell.value() == null ? remarksMessage : `${remarksCell.value()} | ${remarksMessage}`)
      }

      // Fill data from onsite report
      if(timeContainer.report != null) {
        const report = timeContainer.report
        const option = typeOption[report.type]

        statusCell.value(option.translation)
        // Display numbers if the staff didn't work for full hours on the date
        if(report.type === "regular" && report.hoursRegular < timeContainer.basehour) {
          statusCell.value(Math.round((report.hoursRegular / timeContainer.basehour)*100)/100)
          remarksMessage = `●勤務時間の実績(${report.hoursRegular})が、定められた勤務時間(${timeContainer.basehour})より短くなっています。`
          remarksCell.value(remarksCell.value() == null ? remarksMessage : `${remarksCell.value()} | ${remarksMessage}`)
        }

        overTimeCell.value(report.hoursOvertime)
        lateNightCell.value(option.lateNight)
        if(report.hoursLatenight !== "") {
          // Overwrite lateNightCell
          lateNightCell.value(report.hoursLatenight)
          if(option.lateNight !== "") {
            // if both are not empty
            remarksMessage = `●「SH」に時間が入力されているべきでない「工」の種別です。`
            remarksCell.value(remarksCell.value() == null ? remarksMessage : `${remarksCell.value()} | ${remarksMessage}`)
          }
        }

        // For now, only bento cells for subcontructors will be filled.
        if(report.affiliation !== "in-house" && report.bento != null && report.bento !== "") {
          bentoCell.value(report.bento ? "〇" : "")
        }
      // Fill data from timesheet
      } else {
        statusCell.value(status)
        overTimeCell.value(overTimeDuration)
      }

      // Fill other hidden cells
      const inLocation = workplaces.find(wp => wp.value === timeContainer.in_location)?.text ?? timeContainer.in_location
      if(timeContainer.in_location == null && timeContainer.report == null) {
        inLocationCell.value("？")
        console.log(`in===？: ${JSON.stringify(timeContainer)}, name: ${nameOnExcel}`)
      } else {
        inLocationCell.value(inLocation)
        inLocationCell.style({
          "horizontalAlignment": "left",
          "wrapText": false,
          "shrinkToFit": false,
        })
        siteNameCell.value(timeContainer.report?.siteName ?? "現")
      }

      const outLocation = workplaces.find(wp => wp.value === timeContainer.out_location)?.text ?? timeContainer.out_location
      outLocationCell.value(outLocation)
      outLocationCell.style({
        "horizontalAlignment": "left",
        "wrapText": false,
        "shrinkToFit": false,
      })

      inTimeCell.value(timeContainer.in_time)
      outTimeCell.value(timeContainer.out_time)


      const applyStylesIfNotEmpty = (cell, styles) => {
        if(cell.value() != null && cell.value() !== "") {
          cell.style(styles)
        }
      }

      applyStylesIfNotEmpty(overTimeCell, {
        "numberFormat": "0.00",
      })
      applyStylesIfNotEmpty(lateNightCell, {
        "numberFormat": "0.00",
      })
      applyStylesIfNotEmpty(remarksCell, {
        "horizontalAlignment": "left",
        "wrapText": false,
        "shrinkToFit": false,
      })

    })
  }
  return workBook
}

export default {
  fillTemplate,
  extractData,
  extractSheetName,
  fetchAndMerge,
}