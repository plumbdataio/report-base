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
  
  let statusArray = event.queryStringParameters.status
  if(statusArray == null) {
    let orderStatusFetchError = null
    const orderStatusOptions = await admin.database().ref("/typeOptions/orderStatus").once('value')
    .then(snapShot => snapShot.val())
    .catch(error => {
      orderStatusFetchError = error
    })
  
    if(orderStatusFetchError !== null || orderStatusOptions == null) {
      statusArray = null
    } else {
      statusArray = orderStatusOptions
      .filter(status => status.isActive)
      .map(status => status.value)
    }
  } else if(typeof statusArray === "string") {
    statusArray = [statusArray]
  }

  let returnValue = {}
  let errorReason = null
  await admin.database().ref("/workId/list").once('value')
  .then(snapShot => {
    console.log(`### WorkIds data fetched.`)

    returnValue = snapShot.val()
    if(statusArray == null) {
      return
    }

    Object.keys(returnValue).forEach(workId => {
      if( ! statusArray.includes(returnValue[workId].status)) {
        delete returnValue[workId]
      }
    })

    return returnValue

  }, reason => {
    errorReason = reason
    console.log(`### Error !!! reason: ${JSON.stringify(reason)}`);
  })

  if(errorReason !== null)
    return response(400, errorReason.message)
  else
    return response(200, JSON.stringify(returnValue))
}