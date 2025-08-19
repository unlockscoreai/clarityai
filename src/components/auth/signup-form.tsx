
"use client";

import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";
import { auth } from "@/lib/firebase/client"; // Use the client-safe auth instance

const provider = new GoogleAuthProvider();

function GoogleIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.657-3.356-11.303-7.962H6.393C9.702,36.566,16.293,44,24,44z" />
        </svg>
    )
}

export default function SignupForm() {
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleGoogleSignup = async () => {
    setLoadingGoogle(true);

    try {
      // Sign in with Google popup
      await signInWithPopup(auth, provider);

      // Redirect to finish signup page after successful authentication
      // This page will handle creating the user document in Firestore.
      router.push("/finish-signup");
    } catch (err: unknown) {
      // Safe error handling with specific Firebase error codes
      let errorMessage = "An unexpected error occurred.";
      if (err instanceof Error) {
        // Check if it's a Firebase Auth error
        if ((err as any).code) {
          switch ((err as any).code) {
            case 'auth/popup-closed-by-user':
              errorMessage = "You closed the Google sign-in window. Please try again.";
              break;
            case 'auth/cancelled-popup-request':
              errorMessage = "Sign-in cancelled. Another sign-in request is already in progress.";
              break;
            case 'auth/account-exists-with-different-credential':
                errorMessage = "An account already exists with this email. Please sign in using the original method."
                break;
            default:
              errorMessage = `Sign-up failed: ${err.message} (Code: ${(err as any).code})`;
              break;
          }
        } else {
          errorMessage = err.message;
        }
      } else if (typeof err === "string") {
        errorMessage = err;
      }


      console.error("Google Signup Error:", errorMessage);
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: errorMessage,
      });
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <Button
      onClick={handleGoogleSignup}
      disabled={loadingGoogle}
      className="w-full"
    >
      {loadingGoogle ? <Loader2 className="animate-spin"/> : <><GoogleIcon /> Continue with Google</>}
    </Button>
  );
}
