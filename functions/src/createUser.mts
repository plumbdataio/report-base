import {to} from 'await-to-js'
import { admin, getSharedHandler, extractUserInfo, HttpStatusCode } from '@/utils/index.mts'
import type { Handler } from '@netlify/functions'
import type { CreateUserRequestBody } from '@/schema/CreateUser.mts'

export const handler : Handler = getSharedHandler(async (response, event, context) => {
  const { role } = await extractUserInfo(event)
  if( ! role || role !== "admin" ) {
    return response(HttpStatusCode.UNAUTHORIZED_401, "You don't have permission.")
  }

  if( ! event.body ) {
    return response(HttpStatusCode.BAD_REQUEST_400, "Request body shouldn't be empty.")
  }
  const newUserData : CreateUserRequestBody = JSON.parse(event.body)
  if( ! newUserData) {
    return response(HttpStatusCode.BAD_REQUEST_400, "Invalid body data structure.")
  }

  // Step1. Add firebase.auth() user
  const [error1, authUserCreated] = await to(admin.auth().createUser(newUserData.authUser))
  if(error1) {
    error1.message = `admin.auth().createUser() failed. Original message: ${JSON.stringify(error1.message)}`
    console.log(error1);
    return response(HttpStatusCode.BAD_REQUEST_400, error1)
  } else if(authUserCreated.uid == null) {
    throw Error("Unknown Error: auth user is created successfully, but the resulted uid is null.")
  }
  console.log(`### User successfully created: ${JSON.stringify(authUserCreated)}`)

  // Step2. Set custom claims
  const [error2, void2] = await to(admin.auth().setCustomUserClaims(authUserCreated.uid, newUserData.customClaims))
  if(error2) {
    error2.message = `Error on admin.auth().setCustomUserClaims(). Original message: ${JSON.stringify(error2.message)}`
    console.log(error2.message);
    return response(HttpStatusCode.BAD_REQUEST_400, error2)
  }
  console.log(`### Custom claims successfully set: ${JSON.stringify(newUserData.customClaims)}`)


  // Step3. Add user to db
  const [error3, void3] = await to(admin.database().ref(`/staff/${authUserCreated.uid}`).set(newUserData.staff))
  if(error3) {
    error3.message = `Error on admin.database().ref(/staff/${authUserCreated.uid}).set(). Original message: ${JSON.stringify(error3.message)}`
    console.log(error3.message);
    return response(HttpStatusCode.BAD_REQUEST_400, error3)
  }
  console.log(`### Staff data sccessfully registered: ${void3}`);

  // Step4. Add user confidential to db
  const [error4, void4] = await to(admin.database().ref(`/staffConfidential/${authUserCreated.uid}`).set(newUserData.staffConfidential))
  if(error4) {
    error4.message = `Error on admin.database().ref(/staffConfidential/${authUserCreated.uid}).set(). Original message: ${JSON.stringify(error4.message)}`
    console.log(error4.message);
    return response(HttpStatusCode.BAD_REQUEST_400, error4)
  }
  console.log(`### Staff data sccessfully registered: ${void4}`);

  return response(HttpStatusCode.OK_200, "### User successfully created!!! ###")
})