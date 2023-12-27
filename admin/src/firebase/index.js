console.log("### firebase/index.js")
import {initializeApp} from 'firebase/app'
import {initializeAnalytics} from 'firebase/analytics'
import {initializePerformance} from 'firebase/performance'
import {initializeAppCheck, ReCaptchaV3Provider} from 'firebase/app-check'

import auth from  '@/firebase/modules/auth.js'
import db from  '@/firebase/modules/db.js'
import storage from '@/firebase/modules/storage.js'

var firebaseConfig = process.env.FIREBASE_CONFIG

const app = initializeApp(firebaseConfig)
initializeAnalytics(app)
initializePerformance(app)
initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider("6LeGWUIpAAAAAEmSw0ZnCOTRYQA49QsAgOoIMUN2"),
  isTokenAutoRefreshEnabled: true
})
auth.initialize()
db.initialize()
console.log("firebase initialized.");

export default {
  auth, db, storage
}