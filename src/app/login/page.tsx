import LoginForm from '@/components/auth/login-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-background to-blue-100 dark:from-background dark:to-blue-950/20">
      <Card className="w-full max-w-md shadow-2xl border-0">
         <CardHeader className="text-center">
            <CardTitle className="text-3xl font-headline font-bold text-primary">
              Welcome Back
            </CardTitle>
            <CardDescription className="font-body">
              Sign in to access your dashboard.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <LoginForm />
        </CardContent>
         <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
