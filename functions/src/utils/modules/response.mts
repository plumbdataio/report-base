// console.log(`process.env: ${JSON.stringify(process.env, null, 2)}`)
let allowedHosts = {
  [`${process.env.SITE_NAME}.netlify.app`]: {
    allowedOrigins: [
      `https://${process.env.SITE_NAME}.web.app`,
      `https://${process.env.ADMIN_URL}`,
      `https://${process.env.CLIENT_URL}`,
      'http://localhost:5173',
      'http://127.0.0.1:5500',
      'http://127.0.0.1:5501',
    ],
    protocol: ''
  },
  [`preview--${process.env.SITE_NAME}.netlify.app`]: {
    allowedOrigins: [
      `https://${process.env.CLIENT_URL}`,
      'http://localhost:5173',
      'http://127.0.0.1:5500',
      'http://127.0.0.1:5501',
    ],
    protocol: 'https'
  },
  'localhost:8888': {
    allowedOrigins: [
      'http://localhost:5173',
      'http://127.0.0.1:5500',
      'http://127.0.0.1:5501',
    ],
    protocol: 'https'
  },
}

/** Put GAS script IDs to let it call our APIs */
const allowedGASIds : string[] = []

import type { HandlerResponse } from'@netlify/functions'
import { HttpStatusCode } from './http-status-codes.mts'
export const getResponseFunc = (netlifyHost: string, origin: string, userAgent?: string) => (statusCode: number, body: any) : HandlerResponse => {
  const normalize = (value : string) => value.replace(/^[http|https|file]:\/\//, "")
  let allowedOrigin = allowedHosts[netlifyHost]?.allowedOrigins.find(o => normalize(o) == normalize(origin))
  console.log(`netlifyHost: ${netlifyHost}, origin: ${origin}, allowedOrigin: ${allowedOrigin}`)

  if(allowedOrigin == null) {
    if(allowedGASIds.some(id => userAgent?.includes(`compatible; Google-Apps-Script; beanserver; +https://script.google.com; id: ${id}`))) {
      allowedOrigin = "https://script.google.com"
      console.log(`Overwrite allowedOrigin to: ${allowedOrigin}`);
    } else {
      console.error(`allowedOrigin is ${allowedOrigin}`);
      return {
        statusCode: HttpStatusCode.PRECONDITION_FAILED_412,
        body: body,
      }
    }
  }

  return {
    statusCode,
    headers: {
      "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type, Baggage, Sentry-Trace",
      "Access-Control-Allow-Origin": allowedOrigin,
      "Vary": "Origin",
      "Content-type": "text/html; charset=utf-8",
    },
    body,
  }
}