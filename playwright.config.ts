import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: './e2e',
	timeout: 30_000,
	retries: 0,
	use: {
		baseURL: 'http://localhost:5173',
		headless: true
	},
	projects: [
		{
			name: 'chromium',
			use: { browserName: 'chromium' }
		}
	],
	webServer: [
		{
			command: 'cd backend && uv run uvicorn app.main:app --port 8000',
			port: 8000,
			reuseExistingServer: true
		},
		{
			command: 'cd frontend && bun run dev',
			port: 5173,
			reuseExistingServer: true
		}
	]
});
