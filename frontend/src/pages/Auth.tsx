import { useState } from 'react';
import { Navigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { apiPost } from '@/lib/api';

export function Auth() {
	const { user, loading } = useAuth();
	const [email, setEmail] = useState('');
	const [sending, setSending] = useState(false);
	const [sent, setSent] = useState(false);
	const [error, setError] = useState('');

	if (loading) return null;
	if (user) return <Navigate to="/dashboard" replace />;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSending(true);
		setError('');

		try {
			await apiPost('/api/auth/send-magic-link', { email });
			setSent(true);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : 'Failed to send magic link. Please try again.'
			);
		} finally {
			setSending(false);
		}
	};

	if (sent) {
		return (
			<div className="flex min-h-[calc(100vh-100px)] items-center justify-center p-8">
				<Card className="w-full max-w-sm text-center">
					<CardHeader>
						<CardTitle className="text-2xl">Check your email</CardTitle>
						<CardDescription>
							We sent a magic link to <strong>{email}</strong>. Click the link to sign in.
						</CardDescription>
					</CardHeader>
				</Card>
			</div>
		);
	}

	return (
		<div className="flex min-h-[calc(100vh-100px)] items-center justify-center p-8">
			<Card className="w-full max-w-sm">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl">Sign in</CardTitle>
					<CardDescription>Enter your email and we'll send you a magic link.</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="flex flex-col gap-4">
						<div className="flex flex-col gap-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								autoComplete="email"
								required
								placeholder="you@example.com"
								disabled={sending}
							/>
						</div>

						{error && (
							<p className="m-0 rounded-md bg-destructive/10 p-2 text-sm text-destructive">
								{error}
							</p>
						)}

						<Button type="submit" disabled={sending} className="mt-2">
							{sending ? 'Sending...' : 'Send magic link'}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
