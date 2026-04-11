import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  server: {
    open: true
  },
  define: {
    'import.meta.env.VITE_OPENROUTER_API_KEY': JSON.stringify(process.env.VITE_OPENROUTER_API_KEY)
  }
});
