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
  const updatedUser = JSON.parse(event.body).updatedUser

  let role
  await admin.auth().verifyIdToken(idToken).then(decodedIdToken => {
    role = decodedIdToken.role ? decodedIdToken.role : null
  })
  if( ! role || role !== "admin" )
    return response(401, "Requester doesn't have permission.")

  if(role === "admin") {
    let uid = updatedUser.staffId
    let errorReason = null
    // Update firebase.auth() user
    await admin.auth().updateUser(uid, updatedUser.authData)
                      .then(userRecord => {
                        console.log(`### User successfully updated: ${JSON.stringify(userRecord)}`)
                      }, reason => {
                        errorReason = reason
                        console.log(`### Error !!! reason: ${JSON.stringify(reason)}`);
                      })
    if(errorReason !== null) {
      return response(400, errorReason.message)
    }

    // Update custom claims (no 'update' method so 'set')
    await admin.auth().setCustomUserClaims(uid, updatedUser.customClaims)
                      .then(() => {
                        console.log(`### Custom claims successfully updated: ${JSON.stringify(updatedUser.customClaims)}`)
                      }, reason => {
                        errorReason = reason
                        console.log(`### Error !!! reason: ${JSON.stringify(reason)}`);
                      })
    if(errorReason !== null) {
      return response(400, errorReason.message)
    }

    // Update user in realtime database
    await admin.database().ref(`/staff/${uid}`).set(updatedUser.rtdbData).then(val => {
      console.log(`### Staff data sccessfully registered: ${val}`);
    })

    return response(200, "### User successfully updated!!! ###")
  }
}