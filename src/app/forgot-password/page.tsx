
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { resetPassword } from '@/ai/flows/reset-password-flow';
import Image from 'next/image';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setNewPassword(null);
    setError(null);

    try {
      const result = await resetPassword({ email });
      if (result.success && result.newPassword) {
        setNewPassword(result.newPassword);
        toast({
          title: "Password Reset Successful",
          description: "Your new temporary password is shown below.",
        });
      } else {
        setError(result.message);
        toast({
          title: "Password Reset Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
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
                Enter your email and we'll generate a new temporary password for you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!newPassword ? (
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
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </form>
            ) : (
                <Alert>
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Your New Temporary Password:</AlertTitle>
                    <AlertDescription className="font-mono text-lg text-center p-4 bg-muted rounded-md my-2">
                        {newPassword}
                    </AlertDescription>
                    <AlertDescription>
                        Please copy this password. We recommend you log in and change it immediately from your profile page.
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
