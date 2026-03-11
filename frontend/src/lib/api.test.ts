import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiDelete, apiGet, apiPost } from './api';

const mockFetch = vi.fn();

beforeEach(() => {
	vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
	vi.restoreAllMocks();
});

function okResponse(data: any) {
	return { ok: true, json: () => Promise.resolve(data) };
}

function errorResponse(status: number, detail: string) {
	return {
		ok: false,
		statusText: 'Bad Request',
		json: () => Promise.resolve({ detail })
	};
}

function errorResponseEmptyDetail(status: number) {
	return {
		ok: false,
		statusText: 'Bad Request',
		json: () => Promise.resolve({ detail: '' })
	};
}

function errorResponseNoJson(status: number) {
	return {
		ok: false,
		statusText: 'Internal Server Error',
		json: () => Promise.reject(new Error('no json'))
	};
}

describe('apiGet', () => {
	it('returns json on success', async () => {
		mockFetch.mockResolvedValue(okResponse({ status: 'ok' }));
		const result = await apiGet('/api/health');
		expect(result).toEqual({ status: 'ok' });
		expect(mockFetch).toHaveBeenCalledWith('/api/health');
	});

	it('throws with detail on error', async () => {
		mockFetch.mockResolvedValue(errorResponse(400, 'Not found'));
		await expect(apiGet('/api/missing')).rejects.toThrow('Not found');
	});

	it('falls back to statusText when json parse fails', async () => {
		mockFetch.mockResolvedValue(errorResponseNoJson(500));
		await expect(apiGet('/api/broken')).rejects.toThrow('Internal Server Error');
	});

	it('falls back to statusText when detail is empty', async () => {
		mockFetch.mockResolvedValue(errorResponseEmptyDetail(400));
		await expect(apiGet('/api/empty')).rejects.toThrow('Bad Request');
	});
});

describe('apiPost', () => {
	it('sends json body and returns response', async () => {
		mockFetch.mockResolvedValue(okResponse({ id: '1' }));
		const result = await apiPost('/api/users', { email: 'a@b.com' });
		expect(result).toEqual({ id: '1' });
		expect(mockFetch).toHaveBeenCalledWith('/api/users', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email: 'a@b.com' })
		});
	});

	it('throws with detail on error', async () => {
		mockFetch.mockResolvedValue(errorResponse(400, 'Invalid email'));
		await expect(apiPost('/api/users', {})).rejects.toThrow('Invalid email');
	});

	it('falls back to statusText when json parse fails', async () => {
		mockFetch.mockResolvedValue(errorResponseNoJson(500));
		await expect(apiPost('/api/users', {})).rejects.toThrow('Internal Server Error');
	});

	it('falls back to statusText when detail is empty', async () => {
		mockFetch.mockResolvedValue(errorResponseEmptyDetail(400));
		await expect(apiPost('/api/users', {})).rejects.toThrow('Bad Request');
	});
});

describe('apiDelete', () => {
	it('sends delete and returns response', async () => {
		mockFetch.mockResolvedValue(okResponse({ success: true }));
		const result = await apiDelete('/api/item/1');
		expect(result).toEqual({ success: true });
		expect(mockFetch).toHaveBeenCalledWith('/api/item/1', { method: 'DELETE' });
	});

	it('throws with detail on error', async () => {
		mockFetch.mockResolvedValue(errorResponse(403, 'Forbidden'));
		await expect(apiDelete('/api/item/1')).rejects.toThrow('Forbidden');
	});

	it('falls back to statusText when json parse fails', async () => {
		mockFetch.mockResolvedValue(errorResponseNoJson(500));
		await expect(apiDelete('/api/item/1')).rejects.toThrow('Internal Server Error');
	});

	it('falls back to statusText when detail is empty', async () => {
		mockFetch.mockResolvedValue(errorResponseEmptyDetail(400));
		await expect(apiDelete('/api/item/1')).rejects.toThrow('Bad Request');
	});
});
