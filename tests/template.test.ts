import { describe, expect, test } from 'bun:test';
import { processTemplate, shouldExclude, toTitleCase } from '../utils/template';

describe('processTemplate', () => {
	test('replaces single variable', () => {
		const result = processTemplate('Hello {{name}}!', {
			projectName: 'test',
			appTitle: 'Test',
			secretKey: 'abc',
			name: 'world'
		});
		expect(result).toBe('Hello world!');
	});

	test('replaces multiple occurrences', () => {
		const result = processTemplate('{{projectName}} is {{projectName}}', {
			projectName: 'my-app',
			appTitle: 'My App',
			secretKey: 'abc'
		});
		expect(result).toBe('my-app is my-app');
	});

	test('replaces all template variables', () => {
		const result = processTemplate('{{projectName}} - {{appTitle}} ({{secretKey}})', {
			projectName: 'my-app',
			appTitle: 'My App',
			secretKey: 'secret123'
		});
		expect(result).toBe('my-app - My App (secret123)');
	});

	test('leaves unmatched placeholders', () => {
		const result = processTemplate('{{projectName}} {{unknown}}', {
			projectName: 'my-app',
			appTitle: 'My App',
			secretKey: 'abc'
		});
		expect(result).toBe('my-app {{unknown}}');
	});
});

describe('shouldExclude', () => {
	test('matches exact names', () => {
		expect(shouldExclude('node_modules', ['node_modules', '.DS_Store'])).toBe(true);
	});

	test('matches glob extensions', () => {
		expect(shouldExclude('debug.log', ['*.log'])).toBe(true);
	});

	test('does not match non-matching items', () => {
		expect(shouldExclude('src', ['node_modules', '*.log'])).toBe(false);
	});
});

describe('toTitleCase', () => {
	test('converts kebab-case to title case', () => {
		expect(toTitleCase('my-cool-app')).toBe('My Cool App');
	});

	test('handles single word', () => {
		expect(toTitleCase('app')).toBe('App');
	});
});
