import { LoginForm } from "@/components/LoginForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CircleAlert } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary text-primary-foreground rounded-full p-3 w-fit mb-4">
            <CircleAlert className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-headline">PELAJAR</CardTitle>
          <CardDescription>Sign in to report and view road conditions</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
      <p className="text-center text-sm text-muted-foreground mt-4">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-semibold text-primary hover:underline">
          Create one
        </Link>
      </p>
      <p className="text-center text-xs text-muted-foreground mt-2">
        (Default admin: <strong>admin/admin</strong>)
      </p>
    </main>
  );
}
