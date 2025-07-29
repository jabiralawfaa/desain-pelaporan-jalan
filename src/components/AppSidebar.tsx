"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar
} from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/contexts/AppContext';
import { Home, PlusCircle, BarChart3, ShieldCheck, AlertTriangle, LogOut, CircleAlert, UserPlus, ClipboardList } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function AppSidebar() {
  const { reportAreas, logout, user } = useAppContext();
  const pathname = usePathname();
  const { open } = useSidebar();

  const activeCount = reportAreas.filter(a => a.status === 'Active').length;
  const repairedCount = reportAreas.filter(a => a.status === 'Repaired').length;
  
  const commonMenuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: <Home /> },
  ];

  const userMenuItems = [
    { href: '/dashboard/report', label: 'New Report', icon: <PlusCircle /> },
  ];

  const adminMenuItems = [
    { href: '/dashboard/daftar-laporan', label: 'Daftar Laporan', icon: <ClipboardList /> },
    { href: '/dashboard/tambah-surveyor', label: 'Tambah Petugas', icon: <UserPlus /> },
  ];

  const menuItems = user?.role === 'admin' 
    ? [...commonMenuItems, ...adminMenuItems] 
    : [...commonMenuItems, ...userMenuItems];

  return (
    <div className={cn(
      "hidden border-r bg-card sm:flex z-10 transition-transform duration-300 ease-in-out",
      open ? "translate-x-0" : "-translate-x-full"
    )}>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground p-2 rounded-lg">
              <CircleAlert className="h-6 w-6" />
            </div>
            <span className="font-semibold font-headline text-lg">PELAJAR</span>
          </div>
        </SidebarHeader>
        <SidebarContent className="flex flex-col justify-between">
          <div>
            <SidebarMenu>
              {menuItems.map(item => (
                 <SidebarMenuItem key={item.href}>
                  <Link href={item.href} passHref>
                    <SidebarMenuButton asChild isActive={pathname === item.href}>
                      <span className="flex items-center gap-2">
                        {item.icon}
                        <span>{item.label}</span>
                      </span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>

            <div className="p-4 mt-4">
              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    District Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" /> Active Areas</span>
                    <Badge variant="destructive">{activeCount}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-green-500" /> Repaired Areas</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">{repairedCount}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </SidebarContent>
        <SidebarFooter>
            <div className="text-center p-2 text-sm text-muted-foreground">
                Logged in as <strong>{user?.username}</strong> ({user?.role})
            </div>
            <Button variant="ghost" onClick={logout} className="w-full justify-start text-muted-foreground">
                <LogOut className="mr-2 h-4 w-4"/> Logout
            </Button>
        </SidebarFooter>
      </Sidebar>
    </div>
  );
}
