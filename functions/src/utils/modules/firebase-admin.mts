import 'dotenv/config'
import admin from 'firebase-admin'
if(process.env.GOOGLE_APPLICATION_CREDENTIALS == null) {
  throw Error(`Error: firebase admin credential is null.`)
}

try {
  const CREDENTIALS : Record<string, string> = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS)
  const CLIENT_FIREBASE_CONFIG : Record<string, string> = JSON.parse(process.env.FIREBASE_CONFIG as string)
  if(admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(CREDENTIALS),
      databaseURL: CLIENT_FIREBASE_CONFIG.databaseURL,
      storageBucket: CLIENT_FIREBASE_CONFIG.storageBucket,
    })
  }
} catch(e) {
  console.log(`Error: on parsing process.env.GOOGLE_APPLICATION_CREDENTIALS = ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`, e);
}

export { admin }