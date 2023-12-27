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
  
  let reportId = event.queryStringParameters.reportId
  if( ! Boolean(reportId))
    return response(400, "Invalid reportId: reportId shouldn't be null or undefined.")

  let returnValue = {}
  let errorReason = null
  await admin.database().ref(`/inhouseReport/${reportId}`)
                  .remove()
                  .then(result => {
                    console.log(`deleted report: ${reportId}:${JSON.stringify(returnValue)}`);
                  }, reason => {
                    errorReason = reason
                    console.log(`error: ${JSON.stringify(reason)}`)
                  })
  if(errorReason !== null)
    return response(400, JSON.stringify(errorReason))
  else
    return response(200, `Report ID '${reportId}' has been deleted.`)
}