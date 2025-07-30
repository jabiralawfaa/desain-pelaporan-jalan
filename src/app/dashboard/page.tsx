
"use client";

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  Bell,
  ChevronDown,
  MapPin,
  User,
  PlusCircle,
  BarChart,
  UserPlus
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppContext } from '@/contexts/AppContext';
import { ReportArea } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { RecommendationDialog } from '@/components/RecommendationDialog';

const Map = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => <Skeleton className="w-full h-full rounded-md" />
});

export default function DashboardPage() {
  const { user, logout, reportAreas } = useAppContext();
  const [selectedArea, setSelectedArea] = useState<ReportArea | null>(null);
  const [isRecommendationDialogOpen, setRecommendationDialogOpen] = useState(false);

  const handleMarkerClick = (area: ReportArea) => {
    setSelectedArea(area);
  };
  
  if (!user) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col bg-muted/40 font-sans">
      <RecommendationDialog
        isOpen={isRecommendationDialogOpen}
        onOpenChange={setRecommendationDialogOpen}
      />
      
      <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-4 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-7 w-7 text-primary" />
            <h1 className="text-xl font-bold tracking-tight">PELAJAR</h1>
          </div>
          <div className="flex items-center gap-2">
              <Link href="/dashboard/new-report" passHref>
                <Button size="sm" className="text-xs sm:text-sm">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Laporan Baru
                </Button>
              </Link>
              {user.role === 'admin' && (
                <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={() => setRecommendationDialogOpen(true)}>
                  <BarChart className="mr-2 h-4 w-4" />
                  Prioritas
                </Button>
              )}
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={`https://i.pravatar.cc/150?u=${user.username}`} />
                  <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline">{user.username} ({user.role})</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              {user.role === 'admin' && (
                 <Link href="/dashboard/tambah-surveyor" passHref>
                    <DropdownMenuItem>
                      <UserPlus className="mr-2 h-4 w-4" />
                      <span>Tambah Petugas</span>
                    </DropdownMenuItem>
                 </Link>
              )}
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      
      <main className="flex-1 p-4 lg:p-6">
        <div className="w-full h-full">
           <Map 
             reportAreas={reportAreas}
             onMarkerClick={handleMarkerClick} 
             isAdmin={user.role === 'admin'} 
             selectedAreaId={selectedArea?.id ?? null} 
             mapCenter={null}
           />
        </div>
      </main>
    </div>
  );
}
