import { admin, getSharedHandler, extractUserInfo, HttpStatusCode } from '@/utils/index.mts'
import type { Handler } from '@netlify/functions'
import { to } from 'await-to-js'
import { StaffConfidential } from '../../app/src/schema/StaffConfidential'

export const handler : Handler = getSharedHandler(async (res, req, context) => {
  const { role, claims } = await extractUserInfo(req)
  if( req.queryStringParameters == null || req.queryStringParameters?.targetUid == null ) {
    return res(HttpStatusCode.BAD_REQUEST_400, "No targetUid provided.")
  }

  const targetUid = req.queryStringParameters.targetUid
  if( role !== "admin" && claims?.uid !== targetUid ) {
    return res(HttpStatusCode.UNAUTHORIZED_401, "You are not authorized to access this resource.")
  }

  const ref = admin.database().ref(`staffConfidential/${targetUid}`)
  const [error, fullConfidential] = await to(ref.once('value').then(snapshot => snapshot.val() as StaffConfidential))
  if(error) {
    console.error(`Unknown error on fetching credential -> ${JSON.stringify(error)}`);
    return res(HttpStatusCode.INTERNAL_SERVER_ERROR_500, "Unknown error on fetching credential.")
  }

  return res(HttpStatusCode.OK_200, JSON.stringify({
    allowance: {
      transportation: {calcOption: fullConfidential.allowance.transportation.calcOption},
      breakfast: {calcOption: fullConfidential.allowance.breakfast.calcOption},
      lunch: {calcOption: fullConfidential.allowance.lunch.calcOption},
      dinner: {calcOption: fullConfidential.allowance.dinner.calcOption},
      travel: {calcOption: fullConfidential.allowance.travel.calcOption},
    }
  }))
})