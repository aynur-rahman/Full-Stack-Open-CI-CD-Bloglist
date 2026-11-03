const { defineConfig, devices } = require('@playwright/test')
module.exports = defineConfig({
  testDir: './e2e-tests', workers: 1, retries: 0, reporter: 'list',
  use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:3001', trace: 'retain-on-failure' },
  webServer: { command: 'npm run start:test --prefix server', url: 'http://127.0.0.1:3001/api/blogs', reuseExistingServer: false, timeout: 120000 }
})
