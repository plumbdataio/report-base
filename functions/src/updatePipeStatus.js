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
  else if (event.httpMethod !== "POST") {
    return response(405, "Method Not Allowed")
  }

  let returnValue = {}
  let errorReason = null

  const key = event.queryStringParameters?.key
  let value = event.queryStringParameters?.value
  console.log(key);
  console.log(value);

  if(key == null || value == null) {
    return response(400, "### Error: either/both key or/and value is null, but it shouldn't be.")
  }

  value = JSON.parse(value)

  await admin.database().ref(`/pipeTracker/${key}`)
  .set(value)
  .then(snapShot => {
    returnValue = snapShot.val()
    console.log(`### Pipe data updated`)
  }, reason => {
    errorReason = reason
    console.log(`### Error !!! reason: ${JSON.stringify(reason)}`);
  })

  if(errorReason !== null)
    return response(400, errorReason.message)
  else
    return response(200, JSON.stringify(returnValue))
}