import { LoginForm } from "@/components/LoginForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Road } from 'lucide-react';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary text-primary-foreground rounded-full p-3 w-fit mb-4">
            <Road className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-headline">Jalan Blambangan ku</CardTitle>
          <CardDescription>Sign in to report and view road conditions</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
      <p className="text-center text-sm text-muted-foreground mt-4">
        Use <strong>user/user</strong> or <strong>admin/admin</strong> to log in.
      </p>
    </main>
  );
}
