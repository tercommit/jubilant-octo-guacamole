import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    // Trois pages : le jeu, l'expo des assets et le survol du plateau
    rollupOptions: { input: { jeu: 'index.html', expo: 'expo.html', survol: 'survol.html' } },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup.jsx'],
  },
})
