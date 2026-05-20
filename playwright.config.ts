import { defineConfig, devices } from '@playwright/test'
import path from 'path'

// Load environment variables from .env.local natively in Node.js 20+
try {
    process.loadEnvFile(path.resolve(process.cwd(), '.env.local'))
} catch (error) {
    console.warn('No .env.local loaded natively:', error)
}

export default defineConfig({
    testDir: './e2e',
    timeout: 30 * 1000,
    expect: {
        timeout: 5000
    },
    fullyParallel: false, // Run sequentially to prevent database state collisions
    workers: 1,           // Ensure single-threaded execution for clean DB asserts
    reporter: 'list',     // Simple console output reporter
    use: {
        baseURL: 'http://localhost:3002',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    // Automatically reuse or spin up dev server on port 3002
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:3002',
        reuseExistingServer: true,
        timeout: 15 * 1000,
    },
})
