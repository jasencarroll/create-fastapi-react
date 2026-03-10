#!/usr/bin/env bun

import { chmodSync, existsSync, lstatSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { stdin as input, stdout as output } from 'node:process';
import * as readline from 'node:readline/promises';
import {
	copyTemplateDirectory,
	getExcludePatterns,
	toTitleCase,
	type TemplateVariables
} from './utils/template';

export function parseArgs(argv?: string[]) {
	const args = argv ?? process.argv.slice(2);
	const options: {
		name?: string;
		title?: string;
		auth?: string;
		skipInstall?: boolean;
		quiet?: boolean;
	} = {};

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		switch (arg) {
			case '--name':
			case '-n': {
				const value = args[i + 1];
				if (!value || value.startsWith('-')) {
					console.error('Error: --name requires a value');
					process.exit(1);
				}
				options.name = value;
				i++;
				break;
			}
			case '--title':
			case '-t': {
				const value = args[i + 1];
				if (!value || value.startsWith('-')) {
					console.error('Error: --title requires a value');
					process.exit(1);
				}
				options.title = value;
				i++;
				break;
			}
			case '--auth':
			case '-a': {
				const value = args[i + 1];
				if (!value || value.startsWith('-')) {
					console.error('Error: --auth requires a value (password or magic-link)');
					process.exit(1);
				}
				options.auth = value;
				i++;
				break;
			}
			case '--skip-install':
				options.skipInstall = true;
				break;
			case '--quiet':
			case '-q':
				options.quiet = true;
				break;
			case '--help':
			case '-h':
				console.log(`
Usage: create-fastapi-react [options]

Options:
  -n, --name <name>      Project name
  -t, --title <title>    App title (default: derived from name)
  -a, --auth <type>      Auth type: password or magic-link (default: password)
  --skip-install         Skip dependency installation
  -q, --quiet            Suppress output
  -h, --help             Show help
`);
				process.exit(0);
			default:
				if (arg.startsWith('-')) {
					console.error(`Error: Unknown option: ${arg}`);
					console.error('   Run with --help to see available options');
					process.exit(1);
				}
		}
	}

	return options;
}

export function validateProjectName(name: string): string | null {
	if (!name || name.trim().length === 0) {
		return 'Project name is required';
	}
	if (name.length === 1) {
		if (!/^[a-z0-9]$/i.test(name)) {
			return 'Single-character project name must be a letter or number';
		}
	} else {
		const validProjectName = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/i;
		if (!validProjectName.test(name)) {
			return 'Project name must contain only letters, numbers, and hyphens, and start/end with a letter or number';
		}
	}
	return null;
}

function generateSecretKey(): string {
	const bytes = new Uint8Array(32);
	crypto.getRandomValues(bytes);
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

async function main() {
	const cliOptions = parseArgs();
	const isNonInteractive = cliOptions.name !== undefined;

	const rl = isNonInteractive ? null : readline.createInterface({ input, output });

	if (!cliOptions.quiet) {
		console.log(`
  create-fastapi-react

  FastAPI + React full-stack scaffolder
  React 19 / Vite / Tailwind v4 / shadcn
  FastAPI / SQLAlchemy / uv / Ruff
`);
	}

	let sigintHandler: (() => void) | null = null;

	try {
		// Get project name
		let projectName: string;
		if (isNonInteractive) {
			projectName = cliOptions.name as string;
		} else {
			projectName = await rl!.question('  Project name: ');
		}

		const nameError = validateProjectName(projectName);
		if (nameError) {
			console.error(`Error: ${nameError}`);
			process.exit(1);
		}

		// Get app title
		const defaultTitle = toTitleCase(projectName);
		let appTitle: string;
		if (isNonInteractive) {
			appTitle = cliOptions.title || defaultTitle;
		} else {
			const titleInput = await rl!.question(`  App title [${defaultTitle}]: `);
			appTitle = titleInput.trim() || defaultTitle;
		}

		// Get auth type
		let authType: string;
		if (isNonInteractive) {
			authType = cliOptions.auth || 'password';
		} else {
			console.log('\n  Auth type:');
			console.log('  1. Email + Password (default)');
			console.log('  2. Magic Link');
			const authChoice = await rl!.question('\n  Choose (1-2) [1]: ');
			authType = authChoice === '2' ? 'magic-link' : 'password';
		}

		if (!['password', 'magic-link'].includes(authType)) {
			console.error('Error: Auth type must be "password" or "magic-link"');
			process.exit(1);
		}

		// Git init prompt
		let shouldInitGit = true;
		if (!isNonInteractive) {
			const gitAnswer = await rl!.question('\n  Initialize git? (Y/n): ');
			shouldInitGit = gitAnswer.toLowerCase() !== 'n';
		}

		const projectPath = join(process.cwd(), projectName);

		// Create project directory
		try {
			mkdirSync(projectPath);
		} catch (err: unknown) {
			const code = (err as NodeJS.ErrnoException).code;
			if (code === 'EEXIST') {
				console.error(`Error: Directory ${projectName} already exists`);
			} else {
				console.error(`Error: Failed to create directory: ${(err as Error).message}`);
			}
			process.exit(1);
		}

		if (lstatSync(projectPath).isSymbolicLink()) {
			rmSync(projectPath);
			console.error('Error: Project path is a symbolic link. Aborting.');
			process.exit(1);
		}

		// Clean up on Ctrl+C
		sigintHandler = () => {
			console.log('\n  Cancelled. Cleaning up...');
			rl?.close();
			if (existsSync(projectPath)) {
				rmSync(projectPath, { recursive: true, force: true });
			}
			process.exit(130);
		};
		process.on('SIGINT', sigintHandler);

		if (!cliOptions.quiet) {
			console.log('\n  Scaffolding project...\n');
		}

		// Generate secret key
		const secretKey = generateSecretKey();

		// Template variables
		const variables: TemplateVariables = {
			projectName,
			appTitle,
			secretKey
		};

		// Copy default template
		const templateDir = join(import.meta.dir, 'templates', 'default');
		if (!existsSync(templateDir)) {
			console.error('Error: Template directory not found. Installation may be corrupted.');
			process.exit(1);
		}

		await copyTemplateDirectory(templateDir, projectPath, variables, getExcludePatterns());

		// Apply magic-link overlay if selected
		if (authType === 'magic-link') {
			const overlayDir = join(import.meta.dir, 'templates', 'magic-link');
			if (existsSync(overlayDir)) {
				await copyTemplateDirectory(overlayDir, projectPath, variables, getExcludePatterns());
			}
		}

		if (!cliOptions.quiet) {
			console.log('  Created project structure');
		}

		// Create .env from .env.example with generated secret key
		const envExamplePath = join(projectPath, '.env.example');
		const envPath = join(projectPath, '.env');
		if (existsSync(envExamplePath)) {
			const envContent = (await Bun.file(envExamplePath).text()).replace(
				/SECRET_KEY=.*/,
				`SECRET_KEY=${secretKey}`
			);
			await Bun.write(envPath, envContent);
			chmodSync(envPath, 0o600);
		}

		// Create backend data directory
		mkdirSync(join(projectPath, 'backend', 'data'), { recursive: true });

		// Install dependencies
		if (!cliOptions.skipInstall) {
			process.chdir(projectPath);

			if (!cliOptions.quiet) {
				console.log('  Installing backend dependencies...');
			}
			const backendInstall = Bun.spawn(['uv', 'sync'], {
				cwd: join(projectPath, 'backend'),
				stdout: cliOptions.quiet ? 'ignore' : 'pipe',
				stderr: cliOptions.quiet ? 'ignore' : 'pipe'
			});
			await backendInstall.exited;
			if (backendInstall.exitCode !== 0) {
				if (!cliOptions.quiet) {
					console.log('  Warning: Backend install failed. Run "cd backend && uv sync" later.');
				}
			} else if (!cliOptions.quiet) {
				console.log('  Backend dependencies installed');
			}

			if (!cliOptions.quiet) {
				console.log('  Installing frontend dependencies...');
			}
			const frontendInstall = Bun.spawn(['bun', 'install'], {
				cwd: join(projectPath, 'frontend'),
				stdout: cliOptions.quiet ? 'ignore' : 'pipe',
				stderr: cliOptions.quiet ? 'ignore' : 'pipe'
			});
			await frontendInstall.exited;
			if (frontendInstall.exitCode !== 0) {
				if (!cliOptions.quiet) {
					console.log(
						'  Warning: Frontend install failed. Run "cd frontend && bun install" later.'
					);
				}
			} else if (!cliOptions.quiet) {
				console.log('  Frontend dependencies installed');
			}

			// Run alembic migration
			if (!cliOptions.quiet) {
				console.log('  Running initial database migration...');
			}
			const alembicRun = Bun.spawn(['uv', 'run', 'alembic', 'upgrade', 'head'], {
				cwd: join(projectPath, 'backend'),
				stdout: cliOptions.quiet ? 'ignore' : 'pipe',
				stderr: cliOptions.quiet ? 'ignore' : 'pipe',
				env: { ...process.env, DATABASE_URL: `sqlite:///./data/${projectName}.db` }
			});
			await alembicRun.exited;
			if (alembicRun.exitCode === 0 && !cliOptions.quiet) {
				console.log('  Database initialized');
			}
		}

		// Git init
		if (shouldInitGit) {
			const gitInit = Bun.spawn(['git', 'init'], {
				cwd: projectPath,
				stdout: 'ignore',
				stderr: 'ignore'
			});
			await gitInit.exited;

			if (gitInit.exitCode === 0) {
				const gitAdd = Bun.spawn(['git', 'add', '-A'], {
					cwd: projectPath,
					stdout: 'ignore',
					stderr: 'ignore'
				});
				await gitAdd.exited;

				const gitCommit = Bun.spawn(
					['git', 'commit', '-m', 'Initial commit from create-fastapi-react'],
					{
						cwd: projectPath,
						stdout: 'ignore',
						stderr: 'ignore'
					}
				);
				await gitCommit.exited;

				if (!cliOptions.quiet) {
					console.log('  Git repository initialized');
				}
			}
		}

		// Success message
		if (!cliOptions.quiet) {
			console.log(`
  Done! Your project is ready.

  cd ${projectName}

  Development:
    bun run dev          Start both frontend and backend

  Or run separately:
    cd backend && uv run uvicorn app.main:app --reload
    cd frontend && bun run dev

  Testing:
    cd backend && uv run pytest
    cd frontend && bun run build

  Infrastructure:
    bun run infra:init   Create Digital Ocean droplet
    bun run infra:deploy Deploy with Docker
    bun run infra:ssh    SSH into server
`);
		}
	} catch (error) {
		console.error('\nError:', error);
		process.exit(1);
	} finally {
		if (sigintHandler) {
			process.removeListener('SIGINT', sigintHandler);
		}
		rl?.close();
	}
}

main().catch((error) => {
	console.error('Fatal error:', error);
	process.exit(1);
});
