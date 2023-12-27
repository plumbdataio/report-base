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
  
  let date = event.queryStringParameters.date.split('%2F').join('/')
  console.log(`date: ${date}`);
  if( ! Boolean(date))
    return response(400, "Invalid date: date shouldn't be null or undefined.")

  let returnValue = {}
  let errorReason = null
  await admin.database().ref('/inhouseReport')
                  .orderByChild('date')
                  .equalTo(date)
                  .once('value')
                  .then(snapShot => {
                    returnValue = snapShot.toJSON()
                    console.log(`fetched....: ${JSON.stringify(returnValue)}`);
                  }, reason => {
                    errorReason = reason
                    console.log(`error: ${JSON.stringify(reason)}`)
                  })
  if(errorReason !== null)
    return response(400, JSON.stringify(errorReason))
  else
    return response(200, JSON.stringify(returnValue))
}