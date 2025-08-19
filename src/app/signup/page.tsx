import SignupForm from '@/components/auth/signup-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-background to-blue-100 dark:from-background dark:to-blue-950/20">
      <Card className="w-full max-w-md shadow-2xl border-0">
         <CardHeader className="text-center">
            <CardTitle className="text-3xl font-headline font-bold text-primary">
              Create Your Account
            </CardTitle>
            <CardDescription className="font-body">
              Get a free, in-depth analysis of your credit report.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <SignupForm />
        </CardContent>
         <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
