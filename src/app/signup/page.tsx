import { SignupForm } from '@/components/auth/signup-form';

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-background to-blue-100 dark:from-background dark:to-blue-950/20">
      <div className="w-full max-w-lg">
        <SignupForm />
      </div>
    </div>
  );
}
