'use client';

import { useState } from 'react';
import { auth } from '@/lib/firebase/client';
import {
  GoogleAuthProvider,
  signInWithPopup,
  sendSignInLinkToEmail,
} from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const actionCodeSettings = {
  url: 'http://localhost:9002/finish-signup',
  handleCodeInApp: true,
};

function GoogleIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.657-3.356-11.303-7.962H6.393C9.702,36.566,16.293,44,24,44z" />
        </svg>
    )
}


export default function AuthButtons() {
  const [email, setEmail] = useState('');
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const { toast } = useToast();
  const router = useRouter();


  const onGoogle = async () => {
    setLoadingGoogle(true);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      router.push('/finish-signup');
    } catch (e: any) {
      toast({
        title: 'Google sign-in failed',
        description: e.message,
        variant: 'destructive',
      });
    } finally {
        setLoadingGoogle(false);
    }
  };

  const onSendLink = async () => {
    setLoadingEmail(true);
    try {
      if (!email) {
        toast({ title: 'Please enter your email address.', variant: 'destructive' });
        return;
      }
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email);
      toast({ title: 'Magic link sent', description: 'Check your inbox to sign in.' });
    } catch (e: any) {
      toast({
        title: 'Email link error',
        description: e.message,
        variant: 'destructive',
      });
    } finally {
        setLoadingEmail(false);
    }
  };

  const isLoading = loadingGoogle || loadingEmail;

  return (
    <div className="space-y-4">
      <Button className="w-full" onClick={onGoogle} disabled={isLoading}>
        {loadingGoogle ? <Loader2 className="animate-spin" /> : <><GoogleIcon/> Continue with Google</>}
      </Button>
      <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">OR</span>
          </div>
        </div>
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
        />
        <Button onClick={onSendLink} disabled={isLoading}>
             {loadingEmail ? <Loader2 className="animate-spin" /> : 'Send Link'}
        </Button>
      </div>
    </div>
  );
}
