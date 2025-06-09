import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import cesium from 'vite-plugin-cesium'
import path from 'path'

export default defineConfig({
    plugins: [vue(),cesium()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src")
      }
    }
})

