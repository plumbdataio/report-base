export type DotEnvDef = {
  __MODE: "development"|"production",
  __COMMAND: "serve"|"build",
  VERSION: string,
  COMPANY_NAME: string,
  EMAIL_DOMAIN: string,
  PROJECT_NAME: string,
  ADMIN_URL: string,
  CLIENT_URL: string,
  FUNCTIONS_URL: string,
  RECAPTCHA_KEY: string,
  SENTRY_PROJECT_DEV: string,
  SENTRY_PROJECT_PROD: string,
  FIREBASE_CONFIG: string,
  isTesting?: string,
}

declare global {
  namespace NodeJS {
    interface ProcessEnv extends DotEnvDef {}
  }
}

export {}