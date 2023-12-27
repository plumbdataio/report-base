const admin = require('./shared/firebase-admin.js')
let getResponseFunc = require('./shared/response.js')

exports.handler = async (event) => {
  console.log(`headers: ${JSON.stringify(event)}`);
  response = getResponseFunc(event.headers.host, event.headers.origin)

  // CORS preflight request
  // first pass "OPTIONS" method,
  // and we need to return 200 to it manually.
  if(event.httpMethod === "OPTIONS")
    return response(200, "")
  if(JSON.parse(event.body) === {} || ! JSON.parse(event.body).newReport)
    return response(400, "No report has been sent.")

  const newReport = JSON.parse(event.body).newReport
  let errorReason = null

  const autoApprovedNames = await admin.database().ref("/params/autoApprovedNames").once("value")
  autoApprovedNames.val()?.forEach(name => {
    if(newReport.name.replace(/ |　|・/g, "") === name) {
      newReport.approvedBy = "(自動承認)"
    }
  })

  // Add new data
  await admin.database().ref("/inhouseReport")
                    .push(newReport)
                    .then(result => {
                      console.log(`### Report successfully registered!!!: ${JSON.stringify(result)}`)
                    }, reason => {
                      errorReason = reason
                      console.log(`### Error !!! reason: ${JSON.stringify(reason)}`);
                    })
  if(errorReason !== null)
    return response(400, errorReason.message)
  else
    return response(200, "### Report successfully registered!!! ###")
}