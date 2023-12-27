let allowedHosts = {
  [`process.env.FUNCTIONS_URL`]: {
    allowedOrigins: [
      `https://${process.env.ADMIN_URL}`,
      `https://${process.env.CLIENT_URL}`,
      'http://localhost:8080',
      'http://localhost:8081',
      'http://localhost:8082',
      'http://127.0.0.1:5500',
      'http://127.0.0.1:5501',
    ],
    protocol: ''
  },
  [`preview--${process.env.FUNCTIONS_URL}`]: {
    allowedOrigins: [
      `https://${process.env.CLIENT_URL}`,
      'http://localhost:8080',
      'http://localhost:8081',
      'http://localhost:8082',
      'http://127.0.0.1:5500',
      'http://127.0.0.1:5501',
    ],
    protocol: 'https'
  },
  'localhost:8888': {
    allowedOrigins: [
      'http://localhost:8080',
      'http://localhost:8081',
      'http://localhost:8082',
      'http://127.0.0.1:5500',
      'http://127.0.0.1:5501',
    ],
    protocol: 'https'

  },
}

/** Put GAS script IDs to let it call our APIs */
const allowedGASIds = []

const getResponseFunc = (netlifyHost, origin, userAgent) => (statusCode, body) => {
  let allowedOrigin = allowedHosts[netlifyHost]?.allowedOrigins.find(o => o.replace(/^[http|https|file]:\/\//, "") === origin)

  if(allowedOrigin == null) {
    if(allowedGASIds.some(id => userAgent?.includes(`compatible; Google-Apps-Script; beanserver; +https://script.google.com; id: ${id}`))) {
      allowedOrigin = "https://script.google.com"
    } else {
      console.log(`allowedOrigin: ${allowedOrigin}`);
      return {
        statusCode: 412,
        body: body
      }
    }
  }

  console.log(`allowedOrigin: ${allowedOrigin}`);
  return {
    statusCode,
    headers: {
      "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
      "Access-Control-Allow-Origin": allowedOrigin,
      "Vary": "Origin",
      "Content-type": "text/html; charset=utf-8",
    },
    body,
  }
}

module.exports = getResponseFunc