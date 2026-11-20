import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './': site bir alt yolda (GitHub Pages: /dgs-planner/) da çalışsın
export default defineConfig({ base: './', plugins: [react()] });
