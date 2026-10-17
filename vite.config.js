// Vite config — React plugin lagata hai aur dev server port set karta hai.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()], // JSX ko JavaScript mein convert karta hai
  server: {
    port: 5173, // npm run dev -> http://localhost:5173
    host: true,
    open: false,
  },
});
