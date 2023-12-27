console.log("### firebase/modules/auth.js")
import {
  getAuth,
  setPersistence,
  signOut,
  updatePassword,
  onAuthStateChanged,
  reauthenticateWithCredential,
  browserLocalPersistence,
  EmailAuthProvider,
  RecaptchaVerifier,
} from 'firebase/auth'

/**
 * To make firebaseui in ja_JP, you need to run these commands:
 * > cd node_modules/firebaseui
 * > rm -fr *
 * > git clone https://github.com/firebase/firebaseui-web.git ./
 * > npm install
 * > npm run build build-esm-ja
 * > npm run build build-css
*/
import * as firebaseui from 'firebaseui/dist/esm__ja.js'

import store from '@/store/index.js'

var ui = null
export default {
  initialize() {
    setPersistence(getAuth(), browserLocalPersistence)
    onAuthStateChanged(getAuth(), user =>{
      if(!user) {
        store.commit('changeLoginUser', null)
        return
      }
      store.commit('changeLoginUser', user)
    })
  },
  logIn(el, uiShownCallback) {
    if(ui === null || ui === undefined) {
      ui = new firebaseui.auth.AuthUI(getAuth())
      console.log(`new FirebaseUI`)
    } else {
      ui.reset()
      console.log(`reset FirebaseUI`)
    }

    ui.start(el, {
      callbacks: {
        uiShown: function() {
          console.log("uiShown")
          uiShownCallback()
        },
        signInSuccessWithAuthResult: function(authResult, redirectUrl) {
          store.commit('changeLoginUser', authResult.user)
          console.log(`isLoggedIn: ${store.getters.isLoggedIn}`)
          return false;
        },
        signInFailure: function(error) {
          console.log("signInFailure", error);
          alert(error.message);
          store.commit('changeLoginUser', null)
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
          }
        }
      ],
      disableSignUp: {
        status: true,
      },
      adminRestrictedOperation: {
        status: true,
      }
    })
  },
  logOut() {
    signOut(getAuth())
    .then(() => {
      console.log("successfully signed out.")
    })
  },
  refreshCredential(oldPassword) {
    const authUser = store.getters.loginUser
    const credential = EmailAuthProvider.credential(authUser.email, oldPassword)
    return reauthenticateWithCredential(authUser, credential)
  },
  changePassword(newPassword) {
    return updatePassword(store.getters.loginUser, newPassword)
  },
  buildRecaptchaVerifier(id, succeededCallback, expiredCallback) {
    return new RecaptchaVerifier(getAuth(), id, {
      callback: succeededCallback,
      'expired-callback': expiredCallback,
    })
  }
}