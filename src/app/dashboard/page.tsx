
"use client";

import { useState, useMemo } from 'react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useToast } from '@/hooks/use-toast';

const Map = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => <Skeleton className="w-full h-full rounded-md" />
});

type ReportStatusFilter = "all" | "new" | "in_progress" | "repaired";

export default function DashboardPage() {
  const { user, logout, reportAreas } = useAppContext();
  const [selectedArea, setSelectedArea] = useState<ReportArea | null>(null);
  const [isRecommendationDialogOpen, setRecommendationDialogOpen] = useState(false);
  const { toast } = useToast();

  // State for filters
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInputValue, setSearchInputValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReportStatusFilter>('all');
  const [roadTypeFilter, setRoadTypeFilter] = useState('all');
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);

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
    return Array.from(types);
  }, [reportAreas]);

  const handleSearch = () => {
    setSearchQuery(searchInputValue.toLowerCase());
    const targetArea = reportAreas.find(area => 
      area.streetName.toLowerCase().includes(searchInputValue.toLowerCase())
    );

    if (targetArea) {
      // Use streetCoords for panning the map
      if (targetArea.streetCoords && typeof targetArea.streetCoords.lat === 'number' && typeof targetArea.streetCoords.lng === 'number') {
          setMapCenter([targetArea.streetCoords.lat, targetArea.streetCoords.lng]);
      }
    } else {
      toast({
        variant: 'destructive',
        title: 'Area Not Found',
        description: `No report area found for "${searchInputValue}".`,
      });
    }
  };

  const filteredAreas = useMemo(() => {
    return reportAreas.filter(area => {
      // Search Query Filter
      const searchMatch = searchQuery === '' || 
                          area.streetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          area.address.toLowerCase().includes(searchQuery.toLowerCase());

      // Status Filter
      let statusMatch = false;
      switch (statusFilter) {
        case 'new':
          statusMatch = area.status === 'Active' && area.progress === 0;
          break;
        case 'in_progress':
          statusMatch = area.status === 'Active' && area.progress > 0 && area.progress < 100;
          break;
        case 'repaired':
          statusMatch = area.status === 'Repaired' || area.progress === 100;
          break;
        case 'all':
        default:
          statusMatch = true;
      }

      // Road Type Filter
      const roadTypeMatch = roadTypeFilter === 'all' || area.geocodingMetadata?.roadType === roadTypeFilter;

      return searchMatch && statusMatch && roadTypeMatch;
    });
  }, [reportAreas, searchQuery, statusFilter, roadTypeFilter]);

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
      <header className="flex h-16 items-center justify-between border-b bg-background px-4 sm:px-6 z-20">
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

      {/* Main Content */}
      <main className="flex-1 relative">
        {/* Filter Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 lg:p-6 z-10">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 w-full max-w-5xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[2fr_1fr_1fr_auto] gap-4 items-end">
                    <div className="relative">
                        <Label htmlFor="search-area">Cari Daerah</Label>
                        <Search className="absolute left-2.5 top-9 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="search-area"
                          type="search" 
                          placeholder="Cari nama jalan..." 
                          className="pl-8 mt-1" 
                          value={searchInputValue}
                          onChange={(e) => setSearchInputValue(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>
                     <div className="flex flex-col">
                        <Label htmlFor="status-filter">Status Laporan</Label>
                        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ReportStatusFilter)}>
                            <SelectTrigger id="status-filter" className="mt-1">
                                <SelectValue placeholder="Pilih status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="new">Belum Diperbaiki</SelectItem>
                                <SelectItem value="in_progress">Sedang Diperbaiki</SelectItem>
                                <SelectItem value="repaired">Sudah Diperbaiki</SelectItem>
                            </SelectContent>
                        </Select>
                     </div>
                     <div className="flex flex-col">
                        <Label htmlFor="road-type-filter">Tipe Jalan</Label>
                        <Select value={roadTypeFilter} onValueChange={(value) => setRoadTypeFilter(value)}>
                            <SelectTrigger id="road-type-filter" className="mt-1">
                                <SelectValue placeholder="Pilih tipe jalan" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Tipe</SelectItem>
                                {roadTypes.map(type => (
                                    <SelectItem key={type} value={type} className="capitalize">{type.replace(/_/g, ' ')}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                     </div>
                     <Button onClick={handleSearch} className="w-full sm:w-auto">
                        <Search className="mr-2 h-4 w-4"/>
                        Cari
                    </Button>
                </div>
            </div>
        </div>
        
        {/* Map */}
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
