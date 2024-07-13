import {initializeApp, FirebaseOptions} from 'firebase/app'
import {initializeAnalytics} from 'firebase/analytics'
import {initializePerformance} from 'firebase/performance'
import {initializeAppCheck, ReCaptchaV3Provider} from 'firebase/app-check'

import auth from  '@/firebase/modules/auth'
import db from  '@/firebase/modules/db'
// import fs from  '@/firebase/modules/fs'
import storage from '@/firebase/modules/storage.js'

let firebaseConfig
try {
  firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG) as FirebaseOptions
  console.log(`### Database URL: ${firebaseConfig.databaseURL}`);
} catch(e) {
  throw Error(`Error: Couldn't JSON.parse() 'process.env.FIREBASE_CONFIG': ${process.env.FIREBASE_CONFIG}`)
}

const app = initializeApp(firebaseConfig)

if( ! process.env.isTesting) {
  initializeAnalytics(app)
  initializePerformance(app)
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(process.env.RECAPTCHA_KEY),
    isTokenAutoRefreshEnabled: true
  })
}
auth.initialize()
db.initialize()
// fs.initialize()

export default {
  auth,
  db,
  // fs,
  storage,
}