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
  
  let returnValue = {}
  let errorReason = null
  await admin.database().ref("/typeOptions")
                    .once('value')
                    .then(snapShot => {
                      returnValue = snapShot.toJSON()
                      console.log(`### TypeOptions data fetched`)
                    }, reason => {
                      errorReason = reason
                      console.log(`### Error !!! reason: ${JSON.stringify(reason)}`);
                    })
  if(errorReason !== null)
    return response(400, errorReason.message)
  else
    return response(200, JSON.stringify(returnValue))
}