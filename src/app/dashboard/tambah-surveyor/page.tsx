
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, UserPlus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const formSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

type SurveyorFormValues = z.infer<typeof formSchema>;

export default function TambahSurveyorPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAppContext();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<SurveyorFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: SurveyorFormValues) => {
    setIsLoading(true);
    const result = register(data.username, data.email, data.password, 'surveyor');

    if (result.success) {
      toast({ title: 'Petugas Berhasil Didaftarkan', description: `Akun untuk ${data.username} telah dibuat.` });
      form.reset();
      // Optional: redirect or clear form
    } else {
      toast({
        variant: 'destructive',
        title: 'Pendaftaran Gagal',
        description: result.message,
      });
    }
    setIsLoading(false);
  };

  return (
     <div className="flex justify-center items-start py-8">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Tambah Petugas Surveyor</CardTitle>
          <CardDescription>Buat akun baru untuk petugas surveyor yang akan melakukan pelaporan di lapangan.</CardDescription>
        </CardHeader>
        <CardContent>
             <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username Petugas</FormLabel>
                      <FormControl>
                        <Input placeholder="username_surveyor" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Petugas</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="petugas@example.com" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password Sementara</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" /> : 'Buat Akun Petugas'}
                  {!isLoading && <UserPlus className="ml-2 h-4 w-4" />}
                </Button>
              </form>
            </Form>
        </CardContent>
      </Card>
    </div>
  );
}
