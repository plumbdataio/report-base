// You need 2 env files: ".env.development", ".env.production"
import * as dotenv from 'dotenv'
//@ts-expect-error
import * as PackageJson from "./package.json"
import type { DotEnvDef as dotEnvDef } from './process.env'

export const getProcessEnv = (mode: dotEnvDef["__MODE"], command: dotEnvDef["__COMMAND"] ) => {
  const processEnv = dotenv.config({
    path: `../.env.${mode}`
  }).parsed as Record<string, string>

  processEnv.__MODE = mode
  processEnv.__COMMAND = command
  processEnv.VERSION = PackageJson.version ?? "x.x.x"

  return processEnv
}