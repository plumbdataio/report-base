require('dotenv').config()
const admin = require('firebase-admin')

const CREDENTIALS = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS)
if( ! admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(CREDENTIALS),
    databaseURL: "https://pd-report-base-default-rtdb.firebaseio.com"
  })
}

module.exports = admin