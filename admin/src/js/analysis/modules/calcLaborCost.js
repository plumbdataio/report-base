import $firebase from '@/firebase/index.js'

import dayjs from 'dayjs'
import dayjsDuration from 'dayjs/plugin/duration'
dayjs.extend(dayjsDuration)

const add = (totalDuration, duration) => {
  const durationArray = duration.split(':')
  return totalDuration.add(durationArray[0], 'hours')
                      .add(durationArray[1], 'minutes')
                      .add(durationArray[2], 'seconds')
}
const calcLaborCost = async function(targetWorkIds, from, to) {
  /** Cofigurable parameters*/
  const manHourPerDay = 7.0

  // WorkIds should be retreived before the following promises
  const fetchedWorkIds = await $firebase.db.fetchWorkId()

  const promiseArray = []
  // Retreive raw report
  let fetchedReports = {}
  let firstEntryDate, lastEntryDate
  let firstTargetWorkId, lastTargetWorkId

  promiseArray.push($firebase.db.fetchInhouseReport(false, from, to, null, true)
  .then(async reports => {

    // Fill fetchedReports in case it's not filtered later process
    fetchedReports = reports ?? {}

    // Determine [first|last]EntryDate and [first|last]TargetWorkId
    Object.values(fetchedReports)
    .sort((a,b) => a.date > b.date ? 1 : -1) // Ascending
    .some(report => {
      return Object.keys(report.works).some(workId => {
        if(targetWorkIds.includes(workId)) {
          firstTargetWorkId = workId
          firstEntryDate = report.date
          return true
        }
      })
    })
    Object.values(fetchedReports)
    .sort((a,b) => a.date < b.date ? 1 : -1)  // Descending
    .some(report => {
      return Object.keys(report.works).some(workId => {
        if(targetWorkIds.includes(workId)) {
          lastTargetWorkId = workId
          lastEntryDate = report.date
          return true
        }
      })
    })

    // If 'from' is not specified, all the data (date <= to) in DB is fetched,
    // so here assign firstEntryDate to '[workId].startAt' to make it happen less times
    let firstPromise
    if(from == null && firstTargetWorkId != null) {
      firstPromise = await $firebase.db.updateWorkDateOf(firstTargetWorkId, 'startAt', firstEntryDate)
      .then(() => {
        console.log(`Updated "startAt" of /workId/list/${firstTargetWorkId} to ${firstEntryDate}`);
      })
    }

    // Here we assign 'endAt' for the same reason for assigning 'startAt',
    // but only when work.status is not active
    const orderStatusOptions = await $firebase.db.fetchTypeOptions("orderStatus")
    const status = fetchedWorkIds[lastTargetWorkId]?.status
    const orderStatusOption = orderStatusOptions.find(statusOption => statusOption.value === status)
    if( orderStatusOption != null && ! orderStatusOption.isActive) {
      await $firebase.db.updateWorkDateOf(lastTargetWorkId, 'endAt', lastEntryDate)
      .then(() => {
        console.log(`Updated "endAt" of /workId/list/${lastTargetWorkId} to ${lastEntryDate}`);
      })
    }

    if(from != null && to != null) {
      return
    }

    // if 'from' or 'to' is null, we want to filter the data
    if(from == null && firstEntryDate != null) {
      const firstDateInTheMonth = dayjs(firstEntryDate).startOf('month').format('YYYY/MM/DD')

      const filterdReports = {}
      Object.entries(fetchedReports).forEach(([reportId, report]) => {
        if(report.date >= firstDateInTheMonth) {
          filterdReports[reportId] = report
        }
      })
      fetchedReports = filterdReports
    }

    if(to == null && lastEntryDate != null) {
      // const lastEntryDateArray = lastEntryDate.split('/')
      const lastDateInTheMonth = dayjs(lastEntryDate).endOf('month').format('YYYY/MM/DD')

      const filteredReports = {}
      Object.entries(fetchedReports).forEach(([reportId, report]) => {
        if(report.date <= lastDateInTheMonth) {
          filteredReports[reportId] = report
        }
      })
      fetchedReports = filteredReports
    }
  }))

  // Only in-house staff name is required
  // to decide if a user is in-house or not
  let namesInhouse = []
  promiseArray.push($firebase.db.fetchStaff('in-house')
  .then(staffList => {
    Object.values(staffList).forEach(staff => {
      namesInhouse.push(staff.staffName.split(/ |　|・/).join(''))
    })
  }))

  // wait for all promises resolved
  await Promise.all(promiseArray)
  // console.log(`DEBUG: fetchedReports: ${JSON.stringify(fetchedReports)}`);

//////////////////////////////////////////////////////
  // Start first aggregation: report to labor cost and total hours
  let aggregatedReport = {}
  let miscDetails = []
  Object.values(fetchedReports).forEach(report => {
    // Get staff name
    const reporterName = report.name.split(/ |　|・/).join('')

    // Process each work of the day
    Object.entries(report.works).forEach(([workId, workData]) => {

      const dailyCostInhouse = fetchedWorkIds?.[workId]?.costPerManDayInSource ?? 14000
      const dailyCostSubcontractor = fetchedWorkIds?.[workId]?.costPerManDayOutSource ?? 20000

      // Decide labor cost of this staff from their affliation
      let averageDailyLaborCost = namesInhouse.some(name => reporterName === name)
                        ? dailyCostInhouse
                        : dailyCostSubcontractor

      // Process each operation per work
      workData.forEach(operation => {
        // Collect data
        const unitId = operation.unitId ? operation.unitId : '*'
        const workplace = report?.checkedInAt ?? 'none'
        const duration = operation.duration
        const processType = operation.processType
        const materialType = operation.materialType === undefined ? "none" : operation.materialType

        // Structuring the hierarchy of aggregated data 
        let cursor = aggregatedReport
        if(cursor[workId] == null)
          cursor[workId] = {}
        cursor = cursor[workId]
        if(cursor[unitId] == null)
          cursor[unitId] = {}
        cursor = cursor[unitId]
        if(cursor[workplace] == null)
          cursor[workplace] = {}
        cursor = cursor[workplace]
        if(cursor[processType] == null)
          cursor[processType] = {}
        cursor = cursor[processType]
        if(cursor[materialType] == null)
          cursor[materialType] = {}
        cursor = cursor[materialType]
        // At the deepest layer, a key is the labor cost, and a value is the total duration
        if(cursor[averageDailyLaborCost] == null)
          cursor[averageDailyLaborCost] = [dayjs.duration(0), report.date]
        cursor[averageDailyLaborCost][0] = add(cursor[averageDailyLaborCost][0], duration)

        // Collect data which processType is 'misc'
        if(operation.miscDetail) {
          const durationArray = duration.split(':')
          miscDetails.push({
            name: reporterName,
            date: report.date,
            workId: workId,
            unitId: unitId,
            detail: operation.miscDetail.split(',').join('、'),
            duration: dayjs.duration()
                        .add(parseInt(durationArray[0]), 'hours')
                        .add(parseInt(durationArray[1]), 'minutes')
                        .add(parseInt(durationArray[2]), 'seconds')
                        .asHours(),
          })
        }
      })
    })
  })

  fetchedReports = null

  // console.log(`DEBUG: aggregatedReport: ${JSON.stringify(aggregatedReport, null, 2)}`);

  let grandTotalDuration = 0
  let grandTotalLaborCost = 0
  let perMonth = {}
  const result = {};

  if(Object.keys(aggregatedReport).length <= 0) {
    return {
      isNoReportFound: true
    }
  }

  // Start second aggregation: sum up "labor cost" * "total hour" by workId or unitId
  for(const [workId, unitIds] of Object.entries(aggregatedReport)) {
    let durationPerWork = 0
    let laborCostPerWork = 0
    let byProcessArray = []
    const basisForDbCalcObject = {}

    Object.entries(unitIds).forEach(([unitId, workplaces]) => {
      let durationPerUnit = 0
      let laborCostPerUnit = 0

      Object.entries(workplaces).forEach(([workplace, processTypes]) => {
        Object.entries(processTypes).forEach(([processType, materialTypes]) => {
          Object.entries(materialTypes).forEach(([materialType, manDayPrices]) => {
            let perMaterialDuration = 0
            let perMaterialLaborCost = 0

            Object.entries(manDayPrices).forEach(([manDayPrice, array]) => {

              // Calc per-unit basis values
              const duration = array[0].asHours()
              durationPerUnit += duration
              perMaterialDuration += duration
              const laborCost = (parseInt(manDayPrice) / manHourPerDay) * duration
              laborCostPerUnit += laborCost
              perMaterialLaborCost += laborCost
              
              // console.log(`DEBUG: laborCostPerUnit: ${laborCostPerUnit}, durationPerUnit: ${durationPerUnit}`);

              const month = array[1]?.split('/').slice(0,2).join('-')
              if(perMonth[month] == null)
                perMonth[month] = {$duration: 0}
              if(perMonth[month][workId] == null)
                perMonth[month][workId] = {$duration: 0}
              if(perMonth[month][workId][unitId] == null) {
                perMonth[month][workId][unitId] = {$duration: 0}
              }

              perMonth[month].$duration += duration
              perMonth[month][workId].$duration += duration
              perMonth[month][workId][unitId].$duration += duration

              const workplaceCapitalized = workplace.charAt(0).toUpperCase() + workplace.toLowerCase().slice(1)

              perMonth[month][`$duration${workplaceCapitalized}`]
                = (perMonth[month][`$duration${workplaceCapitalized}`] ?? 0) + duration
              perMonth[month][workId][`$duration${workplaceCapitalized}`]
                = (perMonth[month][workId][`$duration${workplaceCapitalized}`] ?? 0) + duration
              perMonth[month][workId][unitId][`$duration${workplaceCapitalized}`]
                = (perMonth[month][workId][unitId][`$duration${workplaceCapitalized}`] ?? 0) + duration

              // console.log(`DEBUG: laborCostBy[processType][materialType]: ${JSON.stringify(laborCostBy[processType][materialType])}`);
            })

            // *** came back to materialType layer *** //
            byProcessArray.push({
              unitId,
              processType,
              materialType,
              duration: perMaterialDuration,
            })

            if( materialType !== 'none' && ! ['none', 'assembling', 'leveling', 'color-coating'].includes(processType)) {
              if( ! basisForDbCalcObject[unitId]) {
                basisForDbCalcObject[unitId] = {}
              }
              if( ! basisForDbCalcObject[unitId][materialType]) {
                basisForDbCalcObject[unitId][materialType] = {
                  duration: 0,
                  laborCost: 0
                }
              }
              basisForDbCalcObject[unitId][materialType].duration += perMaterialDuration
              basisForDbCalcObject[unitId][materialType].laborCost += perMaterialLaborCost
            }
          })
        })
      })
      // *** came back to unitId layer *** //

      // Add per-unit basis value to per-work basis value
      durationPerWork += durationPerUnit
      laborCostPerWork += laborCostPerUnit
      
      // Create properties
      if(result.perUnit == null) 
        result.perUnit = {}
      if(result.perUnit[workId] == null) 
        result.perUnit[workId] = {}

      // Add per-unit result
      result.perUnit[workId][unitId] = {
        $duration: durationPerUnit,
        $manDays: Math.round((durationPerUnit / manHourPerDay) * 100) / 100,
        $laborCost: Math.round(laborCostPerUnit),
      }
    })
    // *** came back to workId layer *** //

    grandTotalDuration += durationPerWork
    grandTotalLaborCost += laborCostPerWork

    const basisForDbCalcFlattened = []
    Object.entries(basisForDbCalcObject).forEach(([unitId, materialTypes]) => {
      Object.entries(materialTypes).forEach(([materialType, data]) => {
        const estimatedDb = fetchedWorkIds?.[workId]?.dbData?.[unitId]?.[materialType]?.estimatedDb ?? 0
        const estimatedUnitPrice = fetchedWorkIds?.[workId]?.dbData?.[unitId]?.[materialType]?.estimatedUnitPrice ?? 0
        basisForDbCalcFlattened.push({
          unitId,
          materialType,
          duration: data.duration,
          laborCost: Math.floor(data.laborCost),
          estimatedDb,
          estimatedUnitPrice
        })
      })
    })

    if(result.perWork == null) 
      result.perWork = {}
    result.perWork[workId] = {
      $duration: durationPerWork,
      $manDays: Math.round((durationPerWork / manHourPerDay) * 100) / 100,
      $laborCost: Math.round(laborCostPerWork),
      $byProcess: byProcessArray,
      $miscs: [],
      $basisForDbCalc: basisForDbCalcFlattened.sort()
    }
  }

  result.perMonth = perMonth

  result.grandTotal = {
    $duration: grandTotalDuration,
    $manDays: Math.round((grandTotalDuration / manHourPerDay) * 100) / 100,
    $laborCost: Math.round(grandTotalLaborCost)
  }

  miscDetails.forEach(misc => {
    const workId = misc.workId
    delete misc.workId
    result.perWork[workId].$miscs.push(misc)
  })

  aggregatedReport = null
  // console.log(`DEBUG: result.perWork: ${JSON.stringify(result.perWork[targetWorkIds[0]], null, 2)}`)
  return result
}

export default { calcLaborCost }
export {calcLaborCost}