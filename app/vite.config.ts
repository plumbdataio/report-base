/// <reference types="vitest" />

import { defineConfig, splitVendorChunkPlugin } from 'vite'
import vue2 from '@vitejs/plugin-vue2'
import { visualizer } from 'rollup-plugin-visualizer';
import { sentryVitePlugin } from "@sentry/vite-plugin";

import { fileURLToPath, URL } from 'node:url'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

import { getProcessEnv } from './process.env'

export default ({mode, command}) => {
  const processEnv = getProcessEnv(mode, command)
  console.log(`mode: ${mode}, command: ${command}`);
  console.log(`process.env.isTesting: ${process.env.isTesting}`);
  return defineConfig({
    plugins: [
      vue2(),
      splitVendorChunkPlugin(),
      visualizer({
        open: true,
        sourcemap: true,
      }),
      {
        name: 'switch-firebase-project',
        buildStart(options) {
          if(processEnv.PROJECT_NAME) {
            console.log(execSync(`echo '__MODE=\'${processEnv.__MODE}\''`).toString())
            console.log(execSync(`firebase use ${processEnv.PROJECT_NAME}`).toString())
          }
        }
      },
      /**
       * the plugin code below is from
       * https://docs.sheetjs.com/docs/demos/static/vitejs/#base64-plugin
      */
      {
        name: "vite-b64-plugin",
        transform(code, id) {
          if(!id.match(/\?b64$/)) return;
          console.log(`b64 transformed: ${id}`);
          var path = id.replace(/\?b64/, "");
          var data = readFileSync(path, "base64");
          return `export default '${data}'`;
        }
      },
      sentryVitePlugin({
        authToken: process.env.SENTRY_AUTH_TOKEN,
        org: "plumbdata",
        project: "report-base-prod",
        disable: Boolean(process.env.isTesting).valueOf() ?? false,
      }),
    ],
    define: {
      "process.env": {
        ...processEnv,
      }
    },
    resolve: {
      alias: {
        //@ts-expect-error
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    root: "./src",
    build: {
      target: "esnext",
      sourcemap: true,
      emptyOutDir: true,
      outDir: mode === "production" ? "../dist.prod" : "../dist",
      rollupOptions: {
        output: {
          chunkFileNames: 'assets/js/vendor/[hash].js',
          entryFileNames: 'assets/js/[name].js',
        },
      },
    }
  })
}