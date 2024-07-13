/// <reference types="vitest" />
import { defineConfig } from 'vite'
import getConfig from './vite.config'

global.process.env.isTesting = true

const viteConfig = getConfig({mode: "development", command: "build"})
const testConfig = defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    env: {
      isTesting: true,
      ...viteConfig.define["process.env"]
    },
    include: ['../test/unit/**/*.{test,spec}.?(c|m)[jt]s?(x)',]
  }
})

const config = Object.assign(viteConfig, testConfig)
export default config