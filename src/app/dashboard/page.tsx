
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
  UserPlus,
  Search,
  SlidersHorizontal
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose
} from '@/components/ui/sheet';
import { useAppContext } from '@/contexts/AppContext';
import { ReportArea } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { RecommendationDialog } from '@/components/RecommendationDialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const Map = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => <Skeleton className="w-full h-full rounded-md" />
});

export default function DashboardPage() {
  const { user, logout, reportAreas } = useAppContext();
  const { toast } = useToast();
  
  const [selectedArea, setSelectedArea] = useState<ReportArea | null>(null);
  const [isRecommendationDialogOpen, setRecommendationDialogOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);

  // States for filters
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roadTypeFilter, setRoadTypeFilter] = useState('all');

  const handleMarkerClick = (area: ReportArea) => {
    setSelectedArea(area);
  };
  
  const roadTypes = useMemo(() => {
    const types = new Set<string>();
    reportAreas.forEach(area => {
      if (area.geocodingMetadata?.roadType) {
        types.add(area.geocodingMetadata.roadType);
      }
    });
    return ['all', ...Array.from(types)];
  }, [reportAreas]);
  
  const filteredAreas = useMemo(() => {
    return reportAreas.filter(area => {
      const searchMatch = searchQuery === '' || area.streetName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const statusMatch = statusFilter === 'all' || 
        (statusFilter === 'not_repaired' && area.progress === 0) ||
        (statusFilter === 'in_progress' && area.progress > 0 && area.progress < 100) ||
        (statusFilter === 'repaired' && area.progress === 100);

      const roadTypeMatch = roadTypeFilter === 'all' || area.geocodingMetadata?.roadType === roadTypeFilter;

      return searchMatch && statusMatch && roadTypeMatch;
    });
  }, [reportAreas, searchQuery, statusFilter, roadTypeFilter]);
  
  const handleSearch = () => {
    if (!searchQuery) return;

    const foundArea = reportAreas.find(area => area.streetName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (foundArea && foundArea.streetCoords) {
      setMapCenter([foundArea.streetCoords.lat, foundArea.streetCoords.lng]);
      setSelectedArea(foundArea);
    } else {
      toast({
        variant: 'destructive',
        title: "Area Tidak Ditemukan",
        description: `Tidak ada laporan untuk area "${searchQuery}".`,
      });
    }
  };
  
  if (!user) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  const topPadding = isFilterVisible ? 'pt-[152px]' : 'pt-[64px]';

  return (
    <div className="relative h-screen w-screen bg-muted/40 font-sans flex flex-col">
      <RecommendationDialog
        isOpen={isRecommendationDialogOpen}
        onOpenChange={setRecommendationDialogOpen}
      />
      
      {/* Top Header for Desktop */}
      <header className="relative z-10 hidden h-16 shrink-0 items-center justify-between border-b bg-background px-4 sm:flex sm:px-6">
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
               <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={() => setIsFilterVisible(!isFilterVisible)}>
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Filter
              </Button>
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

      {/* Filter Bar (Desktop) */}
      <div className={cn(
          "relative z-10 hidden sm:block bg-background/80 p-4 backdrop-blur-sm border-b transition-all duration-300 ease-in-out",
          isFilterVisible ? "opacity-100" : "opacity-0 -translate-y-full h-0 p-0 border-none"
      )}>
        {isFilterVisible && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                <div className="relative col-span-1 md:col-span-2">
                    <Label htmlFor="search-area">Cari Daerah</Label>
                    <Search className="absolute left-2.5 top-9 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="search-area"
                      placeholder="e.g. Jl. Gajah Mada"
                      className="pl-8 mt-1 h-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                </div>

                <div>
                    <Label htmlFor="status-filter">Status Laporan</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger id="status-filter" className="mt-1 h-9">
                        <SelectValue placeholder="Pilih status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Status</SelectItem>
                        <SelectItem value="not_repaired">Belum Diperbaiki</SelectItem>
                        <SelectItem value="in_progress">Sedang Diperbaiki</SelectItem>
                        <SelectItem value="repaired">Sudah Diperbaiki</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
                
                <div className="flex gap-2 items-end">
                  <div className="flex-grow">
                    <Label htmlFor="road-type-filter">Tipe Jalan</Label>
                    <Select value={roadTypeFilter} onValueChange={setRoadTypeFilter}>
                      <SelectTrigger id="road-type-filter" className="mt-1 h-9">
                        <SelectValue placeholder="Pilih tipe" />
                      </SelectTrigger>
                      <SelectContent>
                        {roadTypes.map(type => (
                          <SelectItem key={type} value={type}>
                            {type === 'all' ? 'Semua Tipe' : type.charAt(0).toUpperCase() + type.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleSearch} className="h-9">Cari</Button>
                </div>
            </div>
        )}
      </div>
      
      <main className="flex-1 w-full relative">
        <div className="absolute inset-0 z-0">
           <Map 
             reportAreas={filteredAreas}
             onMarkerClick={handleMarkerClick} 
             isAdmin={user.role === 'admin'} 
             selectedAreaId={selectedArea?.id ?? null} 
             mapCenter={mapCenter}
           />
        </div>
      </main>

      {/* Bottom Nav for Mobile */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 h-20 bg-background border-t z-20 flex justify-around items-center px-2">
         {/* Left Actions */}
        <Sheet open={isFilterVisible} onOpenChange={setIsFilterVisible}>
          <SheetTrigger asChild>
            <div className="flex flex-col items-center space-y-1">
              <Button variant="ghost" size="icon">
                <SlidersHorizontal className="h-5 w-5" />
              </Button>
              <span className="text-xs">Filter</span>
            </div>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-lg">
            <SheetHeader>
              <SheetTitle>Filter Laporan</SheetTitle>
            </SheetHeader>
            <div className="p-4 space-y-4">
              <div className="relative">
                  <Label htmlFor="search-area-mobile">Cari Daerah</Label>
                  <Search className="absolute left-2.5 top-9 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="search-area-mobile"
                    placeholder="e.g. Jl. Gajah Mada"
                    className="pl-8 mt-1"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
              </div>
              <div>
                  <Label htmlFor="status-filter-mobile">Status Laporan</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="status-filter-mobile" className="mt-1">
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="not_repaired">Belum Diperbaiki</SelectItem>
                      <SelectItem value="in_progress">Sedang Diperbaiki</SelectItem>
                      <SelectItem value="repaired">Sudah Diperbaiki</SelectItem>
                    </SelectContent>
                  </Select>
              </div>
              <div>
                <Label htmlFor="road-type-filter-mobile">Tipe Jalan</Label>
                <Select value={roadTypeFilter} onValueChange={setRoadTypeFilter}>
                  <SelectTrigger id="road-type-filter-mobile" className="mt-1">
                    <SelectValue placeholder="Pilih tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    {roadTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type === 'all' ? 'Semua Tipe' : type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
             <SheetFooter>
                <SheetClose asChild>
                  <Button onClick={handleSearch} className="w-full">Terapkan Filter</Button>
                </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
        
        <div className="flex flex-col items-center space-y-1">
          {user.role === 'admin' && (
             <>
              <Button variant="ghost" size="icon" onClick={() => setRecommendationDialogOpen(true)}>
                <BarChart className="h-5 w-5" />
              </Button>
               <span className="text-xs">Prioritas</span>
             </>
          )}
        </div>

        {/* Center FAB */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-4">
            <Link href="/dashboard/new-report" passHref>
                <Button size="icon" className="rounded-full w-16 h-16 shadow-lg">
                    <PlusCircle className="w-8 h-8"/>
                </Button>
            </Link>
        </div>

         {/* Right Actions */}
        <div className="flex flex-col items-center space-y-1">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
           <span className="text-xs">Notif</span>
        </div>
        <div className="flex flex-col items-center space-y-1">
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={`https://i.pravatar.cc/150?u=${user.username}`} />
                    <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mb-2">
              <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
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
           <span className="text-xs">Akun</span>
        </div>
      </div>
    </div>
  );
}

    