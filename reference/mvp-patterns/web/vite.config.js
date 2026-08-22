import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// GitHub Pages 배포 경로: https://newids.github.io/codyssey-e2-1/app/
export default defineConfig({
  base: '/codyssey-e2-1/app/',
  plugins: [react()],
  resolve: {
    alias: {
      // 데이터셋 SSOT는 mvp/data — 복사본을 만들지 않는다
      '@data': fileURLToPath(new URL('../data', import.meta.url)),
    },
  },
  server: {
    fs: { allow: ['..'] },
  },
});
