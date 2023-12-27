const admin = require('./shared/firebase-admin.js')
let getResponseFunc = require('./shared/response.js')

exports.handler = async (event) => {
  console.log(`headers: ${JSON.stringify(event)}`);
  response = getResponseFunc(event.headers.host, event.headers.origin)

  // CORS preflight request first pass "OPTIONS" method, and we need to handle this manually.
  if(event.httpMethod === "OPTIONS")
    return response(200, "")

  if( ! event.headers.authorization )
    return response(400, "No authorization header received.")

  const idToken = event.headers.authorization
  const uid = JSON.parse(event.body).uid
  // console.log(`newUser: ${JSON.stringify(newUser)}`)

  let role
  await admin.auth().verifyIdToken(idToken).then(decodedIdToken => {
    // console.log(`decodedIdToken: ${JSON.stringify(decodedIdToken)}`);
    role = decodedIdToken.role ? decodedIdToken.role : null
    // console.log(`role: ${role}`)
  })
  if( ! role || role !== "admin" )
    return response(401, "Requester doesn't have permission.")

  if(role === "admin") {
    let userInfo
    let errorReason = null
    // Add firebase.auth() user
    await admin.auth().getUser(uid)
                      .then(userRecord => {
                        userInfo = userRecord
                        console.log(`### User info: ${JSON.stringify(userRecord)}`)
                      }, reason => {
                        errorReason = reason
                        console.log(`### Error !!! reason: ${JSON.stringify(reason)}`);
                      })
    if(errorReason !== null)
      return response(400, errorReason.message)

    return response(200, JSON.stringify(userInfo))
  }
}

