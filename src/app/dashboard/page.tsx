
"use client";

import { useState }from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  Bell,
  ChevronDown,
  MapPin,
  Search,
  User,
  PlusCircle,
  BarChart,
  UserPlus
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppContext } from '@/contexts/AppContext';
import { ReportArea } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { RecommendationDialog } from '@/components/RecommendationDialog';

const Map = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => <Skeleton className="w-full h-full rounded-md" />
});

export default function DashboardPage() {
  const { user, logout } = useAppContext();
  const [selectedArea, setSelectedArea] = useState<ReportArea | null>(null);
  const [isRecommendationDialogOpen, setRecommendationDialogOpen] = useState(false);

  const handleMarkerClick = (areaId: string) => {
    // For now, we just log this. Implementation will follow.
    console.log("Marker clicked:", areaId);
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
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b bg-background px-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-7 w-7 text-primary" />
            <h1 className="text-xl font-bold tracking-tight">PELAJAR</h1>
          </div>
          <div className="flex items-center gap-2">
              <Link href="/dashboard/new-report" passHref>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Laporan Baru
                </Button>
              </Link>
              {user.role === 'admin' && (
                <Button variant="outline" onClick={() => setRecommendationDialogOpen(true)}>
                  <BarChart className="mr-2 h-4 w-4" />
                  Prioritas Perbaikan
                </Button>
              )}
          </div>
        </div>
        <div className="flex items-center gap-4">
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
                <span>{user.username} ({user.role})</span>
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

      {/* Main Content */}
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        {/* Filter Bar */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                 <Select>
                    <SelectTrigger>
                        <SelectValue placeholder="Select District" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="lahore">District Lahore</SelectItem>
                        <SelectItem value="karachi">District Karachi</SelectItem>
                    </SelectContent>
                </Select>
                 <Select>
                    <SelectTrigger>
                        <SelectValue placeholder="Select Local Government" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="uc-lahore">UC Lahore</SelectItem>
                    </SelectContent>
                </Select>
                 <Select>
                    <SelectTrigger>
                        <SelectValue placeholder="NA" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="na-1">NA-1</SelectItem>
                    </SelectContent>
                </Select>
                <div className="relative md:col-span-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input type="search" placeholder="Search..." className="pl-8" />
                </div>
                <Button className="bg-green-600 hover:bg-green-700 text-white">Search</Button>
            </div>
        </div>
        
        {/* Map and Filters Panel */}
        <div className="flex flex-1 gap-6">
            <div className="flex-1 relative">
               <Map onMarkerClick={handleMarkerClick} isAdmin={user.role === 'admin'} selectedAreaId={selectedArea?.id ?? null} />
            </div>

            <aside className="hidden w-80 flex-col gap-6 lg:flex">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-base font-medium">Filters</CardTitle>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="check-all" />
                            <label htmlFor="check-all" className="text-sm font-medium leading-none">
                                Check All
                            </label>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[...Array(6)].map((_, i) => (
                             <div key={i} className="space-y-2 border-t pt-4">
                                <h3 className="text-sm font-semibold">Local Government</h3>
                                <div className="flex justify-between">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id={`district-${i}`} />
                                        <label htmlFor={`district-${i}`} className="text-sm">District Lahore</label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id={`uc-${i}`} />
                                        <label htmlFor={`uc-${i}`} className="text-sm">UC Lahore</label>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </aside>
        </div>
      </main>
    </div>
  );
}
