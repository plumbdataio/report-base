import { to } from 'await-to-js'
import { admin, getSharedHandler, extractUserInfo, HttpStatusCode } from '@/utils/index.mts'
import type { Handler } from '@netlify/functions'

export const handler : Handler = getSharedHandler(async (response, event, context) => {
  const {role, uid} = await extractUserInfo(event)
  if( ! role || role !== "admin" ) {
    return response(HttpStatusCode.UNAUTHORIZED_401, "You don't have permission.")
  }

  // delete firebase.auth() user
  const [error1] = await to<void, Error>(admin.auth().deleteUser(uid))
  if(error1) {
    console.log(`### Error !!! reason: ${JSON.stringify(error1)}`)
    return response(HttpStatusCode.BAD_REQUEST_400, `Error: Something went wrong on deleting AuthUser: ${JSON.stringify(error1)}`)
  }
  console.log(`### AuthUser deleted: ${JSON.stringify(uid)}`)

  const [error2] = await to<void, Error>(admin.database().ref(`/staff/${uid}`).remove())
  if(error2) {
    console.log(`### Error !!! error: ${JSON.stringify(error2)}`)
    return response(HttpStatusCode.BAD_REQUEST_400, `Error: Something went wrong on deleting Staff: ${JSON.stringify(error2)}`)
  }
  console.log(`### Staff deleted: ${JSON.stringify(uid)}`)

  const [error3] = await to<void, Error>(admin.database().ref(`/staffConfidential/${uid}`).remove())
  if(error3) {
    console.log(`### Error !!! error: ${JSON.stringify(error3)}`)
    return response(HttpStatusCode.BAD_REQUEST_400, `Error: Something went wrong on deleting StaffConfidential: ${JSON.stringify(error3)}`)
  }
  console.log(`### StaffConfidential deleted: ${JSON.stringify(uid)}`)

  return response(HttpStatusCode.OK_200, "User deletion completed.")
})