import $firebase from '@/firebase/index.js'
import dayjs from 'dayjs'
import dayjsDuration from 'dayjs/plugin/duration'
dayjs.extend(dayjsDuration)

import cloneDeep from 'lodash/cloneDeep'

import {calcLaborCost} from './calcLaborCost.js'

let targetWorkIds
let fromMonth
let toMonth
let laborCost
let fetchedWorkIds
let salesAndExpenses
let categoriesSales, categoriesExpenses
let onSiteProjects = {}
let onSiteConfidentials = {}
let allOnsiteReports = {}
let result = {}

// To be exported
async function calcCostPerWork(targetWorkIds_, fromMonth_, toMonth_) {
  targetWorkIds = targetWorkIds_
  fromMonth = fromMonth_
  toMonth = toMonth_

  // needs to be initialized
  onSiteProjects = {}
  onSiteConfidentials = {}
  allOnsiteReports = {}
  result = {}
  
  if( ! toMonth) {
    toMonth = dayjs().format('YYYY-MM')
  }

  console.log(`Query conditions: targetWorkIds === ${JSON.stringify(targetWorkIds)}, fromMonth: ${fromMonth}, toMonth: ${toMonth}`);

  await fetchData()
  buildResultStructure()
  aggregate()
  return result
}

/**
 * @private
 * @function
 */
async function fetchData(){
  const laborCostPromise = calcLaborCost(targetWorkIds, fromMonth, toMonth)
  .then(async values => {
    laborCost = values

    // data under the path of /workId/list could be updated inside 'calcLaborCost' function,
    // so we fetch it here and await it
    await $firebase.db.fetchWorkId().then(workIds => {
      fetchedWorkIds = workIds
    })
  })

  const salesAndExpensesPromise = $firebase.db.fetchSalesAndExpenses(targetWorkIds, fromMonth, toMonth)
  .then(values => salesAndExpenses = values)

  const categoriesListPromise = $firebase.db.fetchTypeOptions('salesAndExpenses')
  .then(values => {
    categoriesSales = values[0].options.map(option => option.value)
    categoriesExpenses = values[1].options.map(option => option.value)
  })
  
  const onSiteProjectsPromiseArray = targetWorkIds.map(async workId => {
    const projects = await $firebase.db.fetchProjectsWithWorkId(workId) ?? {}
    
    if(Object.keys(projects).length > 0) {
      onSiteProjects = Object.assign(onSiteProjects, projects)

      for(const projectId in projects) {
        const confidential = await $firebase.db.fetchProjectConfidential(projectId)
        Object.assign(onSiteConfidentials, {[projectId]: confidential})

        const onsiteReports = await $firebase.db.fetchOnsiteReport(projectId)
        Object.assign(allOnsiteReports, {[projectId]: onsiteReports})
      }
    }
  })

  // Await all promises to get resolved before go ahead
  await Promise.all([
    laborCostPromise,
    salesAndExpensesPromise,
    categoriesListPromise,
    ...onSiteProjectsPromiseArray
  ])
}

/**
 * @private
 * @function
 */
function buildResultStructure() {
  targetWorkIds.forEach(targetWorkId => {
    if( ! fetchedWorkIds[targetWorkId]) {
      alert(`「工事/ユニット」に登録のない工事番号が、売上/支出データ内にみつかりました。\n\n工事番号：${entry.workId}`)
      return
    }
    const targetWorkResult = result[targetWorkId] = {}
    targetWorkResult.$sales = []
    targetWorkResult.$expenses = []
    targetWorkResult.perUnit = {}
    const workDetail = fetchedWorkIds[targetWorkId]
    if(workDetail.unitIds == null) {
      workDetail.unitIds = []
    }
    workDetail.unitIds.push('*')
    workDetail.unitIds.forEach(unitId => {
      targetWorkResult.perUnit[unitId] = {}
      targetWorkResult.perUnit[unitId].$sales = []
      targetWorkResult.perUnit[unitId].$expenses = []
    })
  })  
}

/**
 * @private
 * @function
 */
function aggregate() {
  if(laborCost?.isNoReportFound) {
    result = {
      isNoReportFound: true
    }
    return
  }

  Object.entries(laborCost.perWork).forEach(([workId, data]) => {
    if( ! targetWorkIds.includes(workId)) return

    const perWorkIdObj = result[workId]
    perWorkIdObj.$manDays = data.$manDays
    perWorkIdObj.$laborCost = data.$laborCost
    perWorkIdObj.$byProcess = data.$byProcess
    perWorkIdObj.$miscs = data.$miscs
    perWorkIdObj.$basisForDbCalc = data.$basisForDbCalc
  })

  Object.keys(laborCost.perUnit).forEach(workId => {
    if( ! targetWorkIds.includes(workId)) return

    const wildCard = laborCost.perUnit[workId]?.["*"] ?? {}
    const costOfWildCard = wildCard?.$laborCost ?? 0
    const manDaysOfWildCard = wildCard?.$manDays ?? 0
    const totalManDaysWithoutWildcard = result[workId].$manDays - manDaysOfWildCard
    Object.entries(laborCost.perUnit[workId]).forEach(([unitId, data]) => {
      let perUnitObj = result[workId].perUnit[unitId]

      // The if clause below will scoop up the value of old unitIds
      if(perUnitObj == null) {
        perUnitObj = {}
        perUnitObj.$sales = []
        perUnitObj.$expenses = []
      }

      perUnitObj.$laborCost = data.$laborCost
      perUnitObj.$byProcess = data.$byProcess
      perUnitObj.$laborCostWithDistributed = data.$laborCost + (data.$manDays / totalManDaysWithoutWildcard) * costOfWildCard
    })
  })

  Object.values(salesAndExpenses).forEach(entry => {
    let salesOrExpenses =
      categoriesSales.includes(entry.category)
      ? '$sales'
      : categoriesExpenses.includes(entry.category)
      ? '$expenses'
      : null
    if(salesOrExpenses == null) return

    // console.log(`DEBUG: entry.workId: ${entry.workId}`);
    if(entry.workId) {
      const workId = entry.workId
      // Skip this entry if entry.workId points out other workIds
      if( ! targetWorkIds.includes(workId)) return
      if( ! fetchedWorkIds[workId]) {
        alert(`「工事/ユニット」に登録のない工事番号が、売上/支出データ内にみつかりました。\n\n工事番号：${entry.workId}`)
        return
      }

      result[workId][salesOrExpenses].push(cloneDeep(entry))
      if(entry.unitId) {
        result[workId].perUnit[entry.unitId][salesOrExpenses].push(cloneDeep(entry))
        return 
      }

      const durationPerWork = laborCost.perWork[workId].$duration
      let unitIds = fetchedWorkIds[workId].unitIds ?? ['*']
      unitIds.forEach(unitId => {
        const durationPerUnit = laborCost.perUnit[workId][unitId]?.$duration ?? 0
        entry.usageWeighting = durationPerUnit / durationPerWork
        entry.weightedAmount = entry.usageWeighting * entry.amount
        result[workId].perUnit[unitId][salesOrExpenses].push(cloneDeep(entry))
      })

      return
    }

    // Skip this entry if both entry.workId and entry.month are blank
    if( ! entry.month) return
    if( ! laborCost.perMonth[entry.month]) return

    targetWorkIds.some(workId => {
      // console.log(`DEBUG: laborCost.perMonth[entry.month][workId]: ${JSON.stringify(laborCost.perMonth[entry.month][workId])}`);
      if( ! laborCost.perMonth[entry.month][workId]) return
      if( entry.workplace && entry.workplace !== fetchedWorkIds[workId]?.workplace) return

      // console.log(`DEBUG: fetchedWorkIds[workId].unitIds: ${fetchedWorkIds[workId].unitIds}`);
      let unitIds = fetchedWorkIds[workId].unitIds ?? ['*']

      const workplace = fetchedWorkIds[workId]?.workplace
      let workplaceCapitalized = workplace != null
        ? workplace.charAt(0).toUpperCase() + workplace.toLowerCase().slice(1)
        : null

      const $durationOf = `$duration${workplaceCapitalized ?? ''}`
      const durationPerMonth = laborCost.perMonth[entry.month][$durationOf]
      const durationPerWork = laborCost.perMonth[entry.month][workId][$durationOf]

      entry.usageWeighting = durationPerWork / durationPerMonth
      entry.weightedAmount = entry.usageWeighting * entry.amount
      result[workId][salesOrExpenses].push(cloneDeep(entry))

      unitIds.forEach(unitId => {
        if(laborCost.perMonth[entry.month][workId][unitId] == null) return

        const durationPerUnit = laborCost.perMonth[entry.month][workId][unitId].$duration
        entry.usageWeighting = durationPerUnit / durationPerMonth
        entry.weightedAmount = entry.usageWeighting * entry.amount
        result[workId].perUnit[unitId][salesOrExpenses].push(cloneDeep(entry))
      })
    })
  })

  // Calc on-site labor cost and add it to result
  targetWorkIds.forEach(workId => {
    result[workId].$onSiteLaborCost = 0
    result[workId].$onSiteManDays = 0

    for(const projectId in onSiteProjects ?? {}) {
      let onSiteLaborCost = 0
      let onSiteManHours = 0
      const isInhouseStaff = (staffId) => onSiteProject?.assignedStaff[staffId]?.companyName === process.env.COMPANY_NAME

      const onSiteProject = onSiteProjects[projectId]
      const onSiteConfidential = onSiteConfidentials[projectId]

      const workHours = parseFloat(onSiteProject?.manhourBasehour) || 8
      
      const inhouseDefaultDailyWage = 14000
      const inhouseDefaultHourlyCost = inhouseDefaultDailyWage / workHours

      const outsourceDefaultDailyWage = onSiteConfidential?.expenseManhour ?? 25000
      const outsourceDefaultHourlyCost = outsourceDefaultDailyWage / workHours
      
      const confidentials = {}
      Object.entries(onSiteConfidential?.assignedStaff ?? {}).forEach(([staffId, confidential]) => {
        const hourlyCostRegular = confidential?.expenseManhour
                        ? parseInt(confidential.expenseManhour) / workHours
                        : isInhouseStaff(staffId) ? inhouseDefaultHourlyCost : outsourceDefaultHourlyCost
        const hourlyCostOvertime = confidential?.expenseOvertime
                        ? parseInt(confidential.expenseOvertime)
                        : onSiteConfidential?.expenseOvertime
                        ? parseInt(onSiteConfidential?.expenseOvertime)
                        : hourlyCostRegular * 1.25
        const hourlyCostLatenight = confidential?.expenseLatenight
                        ? parseInt(confidential.expenseLatenight)
                        : onSiteConfidential?.expenseLatenight
                        ? parseInt(onSiteConfidential?.expenseLatenight)
                        : hourlyCostRegular * 1.5

        confidentials[staffId] = {
          hourlyCostRegular,
          hourlyCostOvertime,
          hourlyCostLatenight,
        }
      })

      Object.values(allOnsiteReports[projectId] ?? {}).forEach(reportsPerDay => {
        Object.keys(reportsPerDay).forEach(staffId => {
          if(confidentials[staffId] == null) {
            const defaultHourlyCost = isInhouseStaff(staffId) ? inhouseDefaultHourlyCost : outsourceDefaultHourlyCost
            confidentials[staffId] = {
              hourlyCostRegular: defaultHourlyCost,
              hourlyCostOvertime: defaultHourlyCost * 1.25,
              hourlyCostLatenight: defaultHourlyCost * 1.5,
            }
            console.log(`### Warning: credentials not found and applied default to: projectId=${projectId}, staffId=${staffId}, default=${JSON.stringify(confidentials[staffId])}`);
          }
          
          onSiteLaborCost += confidentials[staffId].hourlyCostRegular * (reportsPerDay[staffId].hoursRegular
            ? reportsPerDay[staffId].hoursRegular
            : reportsPerDay[staffId].type === "regular"
            ? workHours
            : reportsPerDay[staffId].type === "half-paidoff"
            ? workHours / 2
            : 0 )
          onSiteLaborCost += confidentials[staffId].hourlyCostOvertime * (reportsPerDay[staffId].hoursOvertime ?? 0)
          onSiteLaborCost += confidentials[staffId].hourlyCostLatenight * (reportsPerDay[staffId].hoursLatenight ?? 0)

          onSiteManHours += parseFloat(reportsPerDay[staffId]?.hoursRegular || 0) + parseFloat(reportsPerDay[staffId]?.hoursOvertime || 0)
        })
      })

      result[workId].$onSiteLaborCost += onSiteLaborCost
      result[workId].$onSiteManDays += ( onSiteManHours / workHours )
    }
  })
  // console.log(`DEBUG: result: ${JSON.stringify(result, null, 2)}`)
  return result
}

export default {
  calcCostPerWork,
}
