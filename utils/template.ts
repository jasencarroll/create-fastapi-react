import {
	copyFileSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	statSync,
	writeFileSync
} from 'node:fs';
import { dirname, join } from 'node:path';

export interface TemplateVariables {
	projectName: string;
	appTitle: string;
	secretKey: string;
	[key: string]: string | undefined;
}

export function processTemplate(content: string, variables: TemplateVariables): string {
	let processed = content;
	for (const [key, value] of Object.entries(variables)) {
		if (value !== undefined) {
			const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
			processed = processed.replace(regex, value);
		}
	}
	return processed;
}

export function shouldExclude(item: string, patterns: string[]): boolean {
	return patterns.some((pattern) => {
		if (pattern.startsWith('*.')) {
			return item.endsWith(pattern.slice(1));
		}
		return item === pattern;
	});
}

export async function copyTemplateDirectory(
	sourceDir: string,
	targetDir: string,
	variables: TemplateVariables,
	excludePatterns: string[] = []
): Promise<void> {
	mkdirSync(targetDir, { recursive: true });
	const items = readdirSync(sourceDir);

	for (const item of items) {
		if (shouldExclude(item, excludePatterns)) continue;

		const sourcePath = join(sourceDir, item);
		const targetPath = join(targetDir, item);
		const stat = statSync(sourcePath);

		if (stat.isDirectory()) {
			await copyTemplateDirectory(sourcePath, targetPath, variables, excludePatterns);
		} else {
			await copyTemplateFile(sourcePath, targetPath, variables);
		}
	}
}

export async function copyTemplateFile(
	sourcePath: string,
	targetPath: string,
	variables: TemplateVariables
): Promise<void> {
	mkdirSync(dirname(targetPath), { recursive: true });

	const textExtensions = [
		'.ts',
		'.tsx',
		'.js',
		'.jsx',
		'.json',
		'.md',
		'.txt',
		'.css',
		'.html',
		'.yml',
		'.yaml',
		'.toml',
		'.py',
		'.cfg',
		'.ini',
		'.sh',
		'.env',
		'.example',
		'.gitignore'
	];

	const shouldProcess = textExtensions.some(
		(ext) => sourcePath.endsWith(ext) || sourcePath.includes('.env')
	);

	if (shouldProcess) {
		const content = readFileSync(sourcePath, 'utf-8');
		const processed = processTemplate(content, variables);
		writeFileSync(targetPath, processed);
	} else {
		copyFileSync(sourcePath, targetPath);
	}
}

export function getExcludePatterns(): string[] {
	return [
		'node_modules',
		'bun.lock',
		'uv.lock',
		'.venv',
		'__pycache__',
		'*.pyc',
		'*.db',
		'dist',
		'build',
		'.env.local',
		'.DS_Store',
		'*.log'
	];
}

export function toTitleCase(name: string): string {
	return name
		.split('-')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}
