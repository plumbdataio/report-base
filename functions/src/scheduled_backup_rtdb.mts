import { HttpStatusCode, admin } from '@/utils/index.mts'
import { to } from 'await-to-js'
import dayjs from 'dayjs'
import axios from 'axios'
import type { Handler, HandlerContext, HandlerEvent, HandlerResponse } from "@netlify/functions"

export const handler : Handler = async (event : HandlerEvent, context : HandlerContext) : Promise<HandlerResponse> => {
  performance.clearMarks();
  performance.clearMeasures();
  performance.mark("backup-start");
  let response : HandlerResponse|undefined;
  let isCompleted = false;

  (async () => {
    const timestamp = dayjs().format('YYYYMMDD-HHmmss')

    const db = admin.database()
    const ref = db.ref('/')
    const snapshot = await ref.once('value')
    console.log(`info: data fetch from RTDB completed.`);
    performance.mark("fetch-db-data-end")

    const data = snapshot.val()
    const [error] = await to<void, Error>(admin.storage().bucket().file(`backup/database/rtdb_${timestamp}.json`).save(JSON.stringify(data)))
    if(error) {
      response = {
        statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR_500,
        body: error.message,
      }
    } else {
      console.log("info: Backup completed.");
      performance.mark("backup-end");
      const backupDuration = (performance.measure("backupDuration", "backup-start", "backup-end").duration / 1000).toFixed(2)

      response = {
        statusCode: HttpStatusCode.OK_200,
        body: `Success: Backup completed. - backupTime: ${backupDuration} sec`
      }
    }
  })().then(() => isCompleted = true)

  const sleep = () => new Promise(resolve => setTimeout(resolve, 500))
  for(let i = 1; i <= 18; i++) {
    if(isCompleted) {
      break
    }
    await sleep()
    console.log(`running: ${i/2} seconds`);
  }

  if(isCompleted === false) {
    const baseURL = process.env.IS_LOCAL ? "http://localhost:8888" : `https://${process.env.FUNCTIONS_URL}`
    axios.post(`${baseURL}/.netlify/functions/sendEmail`, {
      subject: `Backup failed/timeout at '${baseURL}'`,
      text: `Backup failed or timeout at '${baseURL}', please check the logs.`,
    })
  }

  if(response) {
    performance.mark("function-end");
    const functionDuration = (performance.measure("functionDuration", "backup-start", "function-end").duration / 1000).toFixed(2)
    response.body += `, functionTime: ${functionDuration} sec`
  }

  return response ?? {
    statusCode: HttpStatusCode.REQUEST_TIMEOUT_408,
    body: "Error: request timed out and might not be completed.",
  }
}