import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES ? '/chat_ag_ui/' : '/',
  build: {
    outDir: '../demo-dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      'chat-ag-ui': resolve(__dirname, '../src/index.ts'),
    },
  },
  server: {
    port: 5174,
  },
})
