
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
  Search
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';


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

  return (
    <div className="relative h-screen w-screen bg-muted/40 font-sans">
      <RecommendationDialog
        isOpen={isRecommendationDialogOpen}
        onOpenChange={setRecommendationDialogOpen}
      />
      
      <header className="relative z-10 flex h-16 shrink-0 items-center justify-between border-b bg-background px-4 sm:px-6">
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

      {/* Filter Bar */}
      <div className="relative z-10 bg-background/80 p-4 backdrop-blur-sm border-b">
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
      </div>
      
      <main className="absolute inset-0 z-0 pt-[104px]">
        <div className="w-full h-full">
           <Map 
             reportAreas={filteredAreas}
             onMarkerClick={handleMarkerClick} 
             isAdmin={user.role === 'admin'} 
             selectedAreaId={selectedArea?.id ?? null} 
             mapCenter={mapCenter}
           />
        </div>
      </main>
    </div>
  );
}

