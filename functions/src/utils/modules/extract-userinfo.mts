import type { HandlerEvent } from "@netlify/functions"
import {admin} from '@/utils/index.mjs'
import { to } from 'await-to-js'

export const extractUserInfo = async (event: HandlerEvent) => {
  const idToken = event.headers?.authorization ?? ""
  let uid = null
  try {
    uid = JSON.parse(event.body ?? "{}")?.uid
  } catch (e) {
    console.error(`on parsing event.body -> ${JSON.stringify(e)}`)
  }

  const [authVerificationError, claims] = await to(admin.auth().verifyIdToken(idToken))
  const role = claims?.role

  return {role, uid, error: authVerificationError, claims}
}