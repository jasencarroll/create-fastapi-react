import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

export function Dashboard() {
	const { user } = useAuth();

	return (
		<div className="mx-auto max-w-3xl px-6 py-8">
			<h1 className="mb-8 text-2xl font-bold">Dashboard</h1>
			<Card>
				<CardHeader>
					<CardTitle>Welcome back</CardTitle>
					<CardDescription>You are signed in as {user?.email}</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground">
						This is your protected dashboard. Start building your app here.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
