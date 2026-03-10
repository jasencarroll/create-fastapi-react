import { describe, expect, test } from 'bun:test';
import { parseArgs, validateProjectName } from '../cli';

describe('parseArgs', () => {
	test('parses --name flag', () => {
		const result = parseArgs(['--name', 'my-app']);
		expect(result.name).toBe('my-app');
	});

	test('parses -n shorthand', () => {
		const result = parseArgs(['-n', 'my-app']);
		expect(result.name).toBe('my-app');
	});

	test('parses --quiet flag', () => {
		const result = parseArgs(['--quiet']);
		expect(result.quiet).toBe(true);
	});

	test('parses -q shorthand', () => {
		const result = parseArgs(['-q']);
		expect(result.quiet).toBe(true);
	});

	test('parses --auth flag', () => {
		const result = parseArgs(['--auth', 'magic-link']);
		expect(result.auth).toBe('magic-link');
	});

	test('parses --title flag', () => {
		const result = parseArgs(['--title', 'My App']);
		expect(result.title).toBe('My App');
	});

	test('parses --skip-install flag', () => {
		const result = parseArgs(['--skip-install']);
		expect(result.skipInstall).toBe(true);
	});

	test('parses combined flags', () => {
		const result = parseArgs(['--name', 'my-app', '--quiet', '--skip-install', '--auth', 'password']);
		expect(result.name).toBe('my-app');
		expect(result.quiet).toBe(true);
		expect(result.skipInstall).toBe(true);
		expect(result.auth).toBe('password');
	});

	test('returns empty options with no args', () => {
		const result = parseArgs([]);
		expect(result.name).toBeUndefined();
		expect(result.quiet).toBeUndefined();
	});
});

describe('validateProjectName', () => {
	test('accepts valid names', () => {
		expect(validateProjectName('my-app')).toBeNull();
		expect(validateProjectName('app123')).toBeNull();
		expect(validateProjectName('a')).toBeNull();
		expect(validateProjectName('my-cool-app')).toBeNull();
	});

	test('rejects empty names', () => {
		expect(validateProjectName('')).not.toBeNull();
		expect(validateProjectName('   ')).not.toBeNull();
	});

	test('rejects names with invalid characters', () => {
		expect(validateProjectName('my_app')).not.toBeNull();
		expect(validateProjectName('my app')).not.toBeNull();
		expect(validateProjectName('my.app')).not.toBeNull();
	});

	test('rejects names starting/ending with hyphen', () => {
		expect(validateProjectName('-app')).not.toBeNull();
		expect(validateProjectName('app-')).not.toBeNull();
	});
});
