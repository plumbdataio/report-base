import { to } from 'await-to-js'
import { admin, getSharedHandler, extractUserInfo, HttpStatusCode } from '@/utils/index.mts'
import type { Handler } from '@netlify/functions'
import type { FetchAuthUserRecordRequestBody, FetchAuthUserRecordResponse, FetchAuthUserRecordResponseStringified } from './schema/FetchAuthUserRecord.mts'
import { UserRecord } from 'firebase-admin/auth'

export const handler : Handler = getSharedHandler(async (response, event, context) => {
  const {role} = await extractUserInfo(event)
  if( ! role || role !== "admin" ) {
    return response(HttpStatusCode.UNAUTHORIZED_401, "You don't have permission.")
  }

  const requestBody : FetchAuthUserRecordRequestBody = JSON.parse(event?.body ?? "{}")
  const targetUid = requestBody.uid

  // Add firebase.auth() user
  const [error, userRecord] = await to<UserRecord, Error>(admin.auth().getUser(targetUid))
  if(error !== null) {
    const errorMessage = `Error: something went wrong on admin.auth().getUser(${targetUid}): ${JSON.stringify(error)}`
    console.log(errorMessage);
    return response(HttpStatusCode.BAD_REQUEST_400, errorMessage)
  }

  const responseBody : FetchAuthUserRecordResponse = userRecord
  const responseBodyStringified : FetchAuthUserRecordResponseStringified = JSON.stringify(responseBody)
  console.log(`Success: response data: ${responseBodyStringified}`)
  return response(HttpStatusCode.OK_200, responseBodyStringified)
})