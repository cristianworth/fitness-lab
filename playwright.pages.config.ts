import { defineConfig } from '@playwright/test';
import base from './playwright.config';

export default defineConfig({
  ...base,
  testMatch: 'public-demo.spec.ts',
  outputDir: 'test-results/pages',
  use: { ...base.use, baseURL: 'http://127.0.0.1:5184/fitness-lab/' },
  webServer: {
    command: 'npm run preview -- --port 5184 --base=/fitness-lab/',
    url: 'http://127.0.0.1:5184/fitness-lab/',
    reuseExistingServer: false,
  },
});
