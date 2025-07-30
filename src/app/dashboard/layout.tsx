
"use client";

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { Skeleton } from '@/components/ui/skeleton';

const publicPaths = ['/dashboard/new-report', '/dashboard/tambah-surveyor'];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAppContext();
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !loading && !user) {
        // Redirect to login if not authenticated
        router.replace('/login');
    }
    
    // Additional check for admin-only pages
    if (isClient && !loading && user && user.role !== 'admin' && pathname === '/dashboard/tambah-surveyor') {
        router.replace('/dashboard');
    }

  }, [user, loading, router, isClient, pathname]);

  // For public sub-pages, render children immediately if user is valid
  if (user && publicPaths.includes(pathname)) {
      return <>{children}</>;
  }

  if (loading || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
          <Skeleton className="h-full w-full" />
      </div>
    );
  }

  return <div className="flex min-h-screen w-full bg-muted/40">{children}</div>;
}
