import { defineConfig } from 'vite';

export default defineConfig({
  // Root remains the default project directory so src/ mapping naturally works
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: 'public/index.html'
    }
  },
  server: {
    open: '/public/index.html'
  }
});
