import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '.emergentagent.com',
      '.preview.emergentagent.com',
      'taskmaster-1575.preview.emergentagent.com'
    ]
  },
  preview: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: [
      'localhost',
      '.emergentagent.com',
      '.preview.emergentagent.com'
    ]
  },
  build: {
    outDir: 'build'
  }
})
