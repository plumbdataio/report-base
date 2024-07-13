import type { Handler, HandlerCallback, HandlerContext, HandlerEvent, HandlerResponse } from '@netlify/functions'
import { admin, HttpStatusCode } from '@/utils/index.mjs'
import { getResponseFunc } from './response.mjs'
import {to} from 'await-to-js'

type MainCallback = (response: ReturnType<typeof getResponseFunc>, event: HandlerEvent, context: HandlerContext, callback?: HandlerCallback) => Promise<HandlerResponse>
export const getSharedHandler = (main: MainCallback): Handler => async (event, context, callback?) => {
  const response = getResponseFunc(event.headers?.host ?? "", event.headers?.origin ?? "")

  // CORS preflight request first pass "OPTIONS" method, and we need to handle this manually.
  if(event.httpMethod === "OPTIONS") {
    console.log("Info: CORS preflight passed.")
    return response(HttpStatusCode.OK_200, "")
  }
  if( ! event.headers.authorization ) {
    console.error("No authorization header received.")
    return response(HttpStatusCode.BAD_REQUEST_400, "No authorization header received.")
  }

  const token = event.headers.authorization
  const [error, result] = await to(admin.auth().verifyIdToken(token))

  if(error) {
    console.log(`Authorization error: ${JSON.stringify(error)}, result: ${JSON.stringify(result)}`);
    return response(HttpStatusCode.UNAUTHORIZED_401, "Unable to verify the token.")
  }

  return await main(response, event, context, callback)
}