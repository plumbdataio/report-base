import { to } from 'await-to-js'
import { admin, getSharedHandler, extractUserInfo, HttpStatusCode } from '@/utils/index.mts'
import type { Handler } from '@netlify/functions'
import type { UserRecord } from 'firebase-admin/auth'
import type { UpdateUserRequestBody } from './schema/UpdateUser.mts'

export const handler : Handler = getSharedHandler(async (response, event, context) => {
  const {role} = await extractUserInfo(event)
  if( ! role || role !== "admin" ) {
    return response(HttpStatusCode.UNAUTHORIZED_401, "You don't have permission.")
  }

  const userData : UpdateUserRequestBody = JSON.parse(event.body ?? "{}")

  // Update firebase.auth() user
  const uid = userData.authUser.uid
  if( ! uid) {
    return response(HttpStatusCode.BAD_REQUEST_400, "Error: authUser.uid is nullish.")
  }
  const [error1, userRecord] = await to<UserRecord, Error>(admin.auth().updateUser(uid, userData.authUser))
  if(error1) {
    console.log(`### Error !!! reason: ${JSON.stringify(error1)}`);
    return response(HttpStatusCode.BAD_REQUEST_400, `Error: admin.auth().updateUser() failed for some reason: ${JSON.stringify(error1)}`)
  }
  console.log(`### User successfully updated: ${JSON.stringify(userRecord)}`)

  // Update custom claims (no 'update' method so 'set')
  const [error2] = await to<void, Error>(admin.auth().setCustomUserClaims(uid, userData.customClaims))
  if(error2) {
    console.log(`### Error !!! reason: ${JSON.stringify(error2)}`);
    return response(HttpStatusCode.BAD_REQUEST_400, `Error: admin.auth().setCustomUserClaims() failed for some reason: ${JSON.stringify(error2)}`)
  }
  console.log(`### Custom claims successfully updated: ${JSON.stringify(userData.customClaims)}`)

  // Update user in realtime database
  const [error3] = await to<void, Error>(admin.database().ref(`/staff/${uid}`).set(userData.staff))
  if(error3) {
    return response(HttpStatusCode.BAD_REQUEST_400, `Error: admin.database().set() failed for some reason: ${JSON.stringify(error3)}`)
  }
  console.log(`### Staff data sccessfully registered: ${JSON.stringify(userData.customClaims)}`);
  return response(HttpStatusCode.OK_200, "Success: User successfully updated.")
})