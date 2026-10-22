import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    // Deux pages : le jeu et l'expo des assets
    rollupOptions: { input: { jeu: 'index.html', expo: 'expo.html' } },
  },
})
