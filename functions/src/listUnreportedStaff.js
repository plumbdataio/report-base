const admin = require('./shared/firebase-admin.js')
let getResponseFunc = require('./shared/response.js')

const dayjs = require('dayjs')
require('dayjs/locale/ja')
dayjs.locale("ja")

exports.handler = async (event) => {
  console.log(`headers: ${JSON.stringify(event)}`);
  response = getResponseFunc(event.headers.host, event.headers.origin, event.headers["user-agent"])

  // CORS preflight request
  // first pass "OPTIONS" method,
  // and we need to return 200 to it manually.
  if(event.httpMethod === "OPTIONS")
    return response(200, "")

  const today = dayjs().add(9,'h')
  console.log(`#DEBUG: today: ${today.format('YYYY-MM-DD')}`);
  
  const queriedDate = event?.queryStringParameters?.date
  const isAutomatedApiCall = !! queriedDate
  let targetDate = isAutomatedApiCall ? dayjs(queriedDate).add(9,'h') : today.subtract(1, "d")
  console.log(`#DEBUG: target date: ${targetDate.format('YYYY-MM-DD')}`);
  
  if( ! isAutomatedApiCall && today.day() === 0){
    const message = `Today (${today.format('YYYY/MM/DD(dd)')}) must be a off-day! Have a nice Day!:)`
    console.log(message)
    return response(200, message)
  }

  if( isAutomatedApiCall && today.day() === 0){
    targetDate = targetDate.subtract(1, 'd')
  }

  let listOfResourceIds = []
  const listOfStaffName = []
  const workplaceOptions = await (await admin.database().ref(`/typeOptions/workplace`).once('value')).val()
  await admin.database().ref(`/factorySchedule/${targetDate.format('YYYY-MM')}`).once('value')
  .then(snapShot => {
    const data = snapShot.val()

    data?.events.forEach(calendarEvent => {
      const eventStart = dayjs(calendarEvent.start).add(9,'h').format('YYYY-MM-DD')
      const eventEnd = dayjs(calendarEvent.end).add(9,'h').subtract(1,"d").format('YYYY-MM-DD')

      if(eventStart <= targetDate.format('YYYY-MM-DD') && targetDate.format('YYYY-MM-DD') <= eventEnd) {        
        if(workplaceOptions
              .filter(wp => wp.category === "factory")
              .some(wp => wp.value === calendarEvent.extendedProps.workPlace)) {

          listOfResourceIds.push(calendarEvent.resourceId)
        }
      }
    })
    // console.log(`#DEBUG: listOfResourceIds: ${JSON.stringify(listOfResourceIds)}`);

    listOfResourceIds = Array.from(new Set(listOfResourceIds))
    data?.resources.forEach(resource => {
      if(listOfResourceIds.includes(resource.id))
        listOfStaffName.push(resource.extendedProps.staffName.replace(/ |　|・|\//g, ""))
    })
    // console.log(`#DEBUG: listOfStaffName: ${JSON.stringify(listOfStaffName)}`);
  })

  const setOfStaffName = new Set(listOfStaffName)
  const unlistedOnFactorySchedule = []
  const reportConfirmed = []
  const unapprovedReport = []
  await admin.database().ref(`/inhouseReport`).orderByChild(`date`).equalTo(`${targetDate.format('YYYY/MM/DD')}`).once('value')
  .then(snapShot => {
    const data = snapShot.exists() ? snapShot.val() : {}

    Object.values(data).forEach(report => {
      if( report.approvedBy == null || report.approvedBy === "")
        unapprovedReport.push(report)
      const name = report.name.replace(/ |　|・|\//g, "")
      const isStaffPresented = setOfStaffName.delete(name)
      if(isStaffPresented) {
        reportConfirmed.push(name)
      } else {
        unlistedOnFactorySchedule.push(name)
      }
    })
  })

  const reportNotSubmitted = Array.from(setOfStaffName)
  const status = unapprovedReport.length <= 0 && Array.from(setOfStaffName).length <= 0 && unlistedOnFactorySchedule.length <= 0
                ? "no-action-needed" : "action-required"

  const responseBody = JSON.stringify({
      status,
      now: new Date().toTimeString(),
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      targetDate: targetDate.format('YYYY/MM/DD(dd)'),
      isBeforeClosedDay: today.day() === 1,
      unapprovedReportCount: unapprovedReport.length,
      reportConfirmed,
      reportNotSubmitted,
      unlistedOnFactorySchedule,
  }, null, 2)

  return response(200, responseBody)
}