export async function apiGet(url: string) {
	const res = await fetch(url);
	if (!res.ok) {
		const error = await res.json().catch(() => ({ detail: res.statusText }));
		throw new Error(error.detail || res.statusText);
	}
	return res.json();
}

export async function apiPost(url: string, body: any) {
	const res = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});
	if (!res.ok) {
		const error = await res.json().catch(() => ({ detail: res.statusText }));
		throw new Error(error.detail || res.statusText);
	}
	return res.json();
}

export async function apiDelete(url: string) {
	const res = await fetch(url, { method: 'DELETE' });
	if (!res.ok) {
		const error = await res.json().catch(() => ({ detail: res.statusText }));
		throw new Error(error.detail || res.statusText);
	}
	return res.json();
}
