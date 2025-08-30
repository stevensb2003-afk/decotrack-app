import { LoginForm } from '@/components/auth/login-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Image from 'next/image';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
               <Image src="/logo_azul.png" alt="DecoTrack Logo" width={50} height={50} className="dark:hidden" />
               <Image src="/logo_blanco.png" alt="DecoTrack Logo" width={50} height={50} className="hidden dark:block" />
            </div>
            <CardTitle className="text-3xl font-bold">DecoTrack</CardTitle>
            <CardDescription>Welcome back! Please sign in to your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
