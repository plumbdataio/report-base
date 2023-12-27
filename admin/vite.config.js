import { fileURLToPath, URL } from 'node:url'

import { defineConfig, splitVendorChunkPlugin } from 'vite'
import vue2 from '@vitejs/plugin-vue2'
import { visualizer } from 'rollup-plugin-visualizer';

import CustomerConfig from "./src/customer_info.js"
import PackageJson from "./package.json"

export default ({mode}) => defineConfig({
  plugins: [
    vue2(),
    splitVendorChunkPlugin(),
    visualizer({
      open: true
    }),
  ],
  define: {
    "process.env": {
      BUILD: "web",
      VERSION: PackageJson.version ?? "x.x.x",
      ...CustomerConfig
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  root: "./src",
  build: {
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