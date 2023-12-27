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
  else if (event.httpMethod !== "GET") {
    return response(405, "Method Not Allowed")
  }

  const key = event.queryStringParameters?.key
  console.log(key);

  let returnValue = {}
  let errorReason = null
  await admin.database().ref(`/pipeTracker/${key}`)
  .once('value')
  .then(snapShot => {
    returnValue = snapShot.val()
    console.log(`### Pipe data fetched`)
  }, reason => {
    errorReason = reason
    console.log(`### Error !!! reason: ${JSON.stringify(reason)}`);
  })

  if(errorReason !== null)
    return response(400, errorReason.message)
  else
    return response(200, JSON.stringify(returnValue))
}