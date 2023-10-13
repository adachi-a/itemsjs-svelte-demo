import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  base: '/itemsjs-svelte-demo/',
  build: {
    rollupOptions: {
      input: {
        koban: 'index.html',
        animation: 'animation.html'
      }
    }
  }
});
