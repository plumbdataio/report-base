import {
  getAuth,
  setPersistence,
  signOut,
  updatePassword,
  updateEmail,
  onAuthStateChanged,
  reauthenticateWithCredential,
  browserLocalPersistence,
  EmailAuthProvider,
  RecaptchaVerifier,
  getIdTokenResult,
} from 'firebase/auth'

import db from '@/firebase/modules/db'

/**
 * To make firebaseui in ja_JP, you need to run these commands:
 * > cd node_modules/firebaseui; rm -fr *; git clone https://github.com/firebase/firebaseui-web.git ./ ; npm install; npm run build build-esm-ja; npm run build build-css
*/
import * as firebaseui from 'firebaseui/dist/esm__ja'
import { tstore } from '@/store/index'

let ui : firebaseui.auth.AuthUI
export default {
  initialize() {
    setPersistence(getAuth(), browserLocalPersistence)
    onAuthStateChanged(getAuth(), user =>{
      tstore.auth.changeLoginUser(user ?? undefined)
      if(user != null) {
        db.setUpPresence()
      }
    })
  },
  logIn(el: Parameters<typeof ui.start>[0], uiShownCallback: () => void) {
    if( ! ui) {
      ui = new firebaseui.auth.AuthUI(getAuth())
    } else {
      ui.reset()
      console.log(`reset FirebaseUI`)
    }

    ui.start(el, {
      callbacks: {
        uiShown: function() {
          console.log("### firebaseui is shown - meaning that the user is trying to log in, or logged out")
          uiShownCallback()
        },
        signInSuccessWithAuthResult: function(authResult, redirectUrl) {
          tstore.auth.changeLoginUser(authResult.user)
          console.log(`### Successfully logged in. User: ${authResult.user.email}`)
          return false;
        },
        signInFailure: function(error) {
          console.log("signInFailure", error);
          alert(error.message);
          tstore.auth.changeLoginUser(undefined)
        },
      },
      signInOptions: [
        {
          provider: EmailAuthProvider.PROVIDER_ID,
          requireDisplayName: false,
          signInMethod: EmailAuthProvider.EMAIL_PASSWORD_SIGN_IN_METHOD,
          recaptchaParameters: {
            type: "image",
            size: "normal",
            badge: "inline",
          },
          // disableSignUp: {
          //   status: true,
          // },
          // adminRestrictedOperation: {
          //   status: true,
          // }
        }
      ],
    })
  },
  logOut() {
    signOut(getAuth())
    .then(() => {
      console.log("### Signed out successfully.")
    })
  },
  refreshUser() {
    return getAuth().currentUser?.reload()
    /** Below is not necessary
     *  (currentUser.reload() will somehow reload tstore.auth.loginUser as well)
     */
    // .then(() => {
    //   const currentUser = getAuth().currentUser
    //   if(currentUser) {
    //     tstore.auth.changeLoginUser(currentUser)
    //   }
    // })
  },
  refreshCredential(oldPassword: string) {
    const authUser = tstore.auth.loginUser
    if( ! authUser) {
      throw Error(`Error: Couldn't refresh auth credential because 'auth.loginUser' in Vuex store is null or undefined.`)
    } else if( ! authUser.email ) {
      throw Error(`Error: Couldn't refresh auth credential because 'auth.loginUser.email' in Vuex store is null or undefined.`)
    }
    const credential = EmailAuthProvider.credential(authUser.email, oldPassword)
    return reauthenticateWithCredential(authUser, credential)
  },
  updateEmail(newEmail : string) {
    if( ! tstore.auth.loginUser ) {
      throw Error(`Error: Couldn't update auth email because 'auth.loginUser' in Vuex store is null or undefined.`)
    }
    return updateEmail(tstore.auth.loginUser, newEmail)
  },
  changePassword(newPassword: string) {
    if( ! tstore.auth.loginUser ) {
      throw Error(`Error: Couldn't change password because 'auth.loginUser' in Vuex store is null or undefined.`)
    }
    return updatePassword(tstore.auth.loginUser, newPassword)
  },
  buildRecaptchaVerifier(elementId: string, succeededCallback: () => void, expiredCallback: () => void) {
    return new RecaptchaVerifier(getAuth(), elementId, {
      callback: succeededCallback,
      'expired-callback': expiredCallback,
    })
  },
  getIdTokenResult() {
    if( ! tstore.auth.loginUser ) {
      throw Error(`Error: getIdTokenResult() failed because 'auth.loginUser' in Vuex store is null or undefined.`)
    }
    return getIdTokenResult(tstore.auth.loginUser)
  }
}