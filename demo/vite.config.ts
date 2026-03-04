import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'chat-ag-ui': resolve(__dirname, '../src/index.ts'),
    },
  },
  server: {
    port: 5174,
  },
})
