import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';

export function Auth() {
	const { user, loading, refresh } = useAuth();
	const navigate = useNavigate();
	const [isLogin, setIsLogin] = useState(true);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState('');

	if (loading) return null;
	if (user) return <Navigate to="/dashboard" replace />;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSubmitting(true);
		setError('');

		const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

		try {
			const res = await fetch(endpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password })
			});

			if (!res.ok) {
				const data = await res.json();
				setError(data.detail || 'Something went wrong');
				return;
			}

			await refresh();
			navigate('/dashboard');
		} catch {
			setError('Network error. Please try again.');
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="flex min-h-[calc(100vh-100px)] items-center justify-center p-8">
			<Card className="w-full max-w-sm">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl">{isLogin ? 'Sign in' : 'Create account'}</CardTitle>
					<CardDescription>
						{isLogin ? 'Sign in to your account' : 'Create a new account to get started'}
					</CardDescription>
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
								disabled={submitting}
							/>
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								autoComplete={isLogin ? 'current-password' : 'new-password'}
								required
								placeholder="At least 8 characters"
								disabled={submitting}
							/>
						</div>

						{error && (
							<p className="m-0 rounded-md bg-destructive/10 p-2 text-sm text-destructive">
								{error}
							</p>
						)}

						<Button type="submit" disabled={submitting} className="mt-2">
							{submitting ? 'Please wait...' : isLogin ? 'Sign in' : 'Create account'}
						</Button>

						<p className="text-center text-sm text-muted-foreground">
							{isLogin ? "Don't have an account? " : 'Already have an account? '}
							<button
								type="button"
								className="font-medium text-foreground underline"
								onClick={() => {
									setIsLogin(!isLogin);
									setError('');
								}}
							>
								{isLogin ? 'Sign up' : 'Sign in'}
							</button>
						</p>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
