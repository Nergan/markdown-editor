import { defineConfig } from 'vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    basicSsl(),
    nodePolyfills(),
  ],
})

