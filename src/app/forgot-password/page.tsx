
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MailCheck } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
        toast({ title: "Email required", description: "Please enter your email address.", variant: "destructive" });
        return;
    }
    setIsLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setEmailSent(true);
    } catch (error: any) {
      console.error("Password reset error:", error);
      let message = "An unexpected error occurred. Please try again.";
      if (error.code === 'auth/user-not-found') {
        message = "No user found with this email address.";
      }
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
             <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
               <Image src="/logo_azul.png" alt="DecoTrack Logo" width={50} height={50} className="dark:hidden" />
               <Image src="/logo_blanco.png" alt="DecoTrack Logo" width={50} height={50} className="hidden dark:block" />
            </div>
            <CardTitle className="text-3xl font-bold">Forgot Password</CardTitle>
            <CardDescription>
                {emailSent 
                    ? "Check your inbox for the next steps." 
                    : "Enter your email to receive a password reset link."
                }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!emailSent ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>
            ) : (
                <Alert variant="default" className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
                    <MailCheck className="h-4 w-4 text-green-600" />
                    <AlertTitle>Email Sent!</AlertTitle>
                    <AlertDescription>
                        A password reset link has been sent to <strong>{email}</strong>. Please check your inbox (and spam folder).
                    </AlertDescription>
                </Alert>
            )}

             <div className="mt-4 text-center text-sm">
                <Link href="/login" className="text-primary hover:underline underline-offset-4">
                  Back to Login
                </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
