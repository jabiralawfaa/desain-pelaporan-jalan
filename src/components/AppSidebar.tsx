"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter
} from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/contexts/AppContext';
import { Home, PlusCircle, BarChart3, Wrench, ShieldCheck, AlertTriangle, LogOut, CircleAlert } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export function AppSidebar() {
  const { reports, logout, user } = useAppContext();
  const pathname = usePathname();

  const reportedCount = reports.filter(r => r.repairStatus === 'Reported').length;
  const inProgressCount = reports.filter(r => r.repairStatus === 'In Progress').length;
  const repairedCount = reports.filter(r => r.repairStatus === 'Repaired').length;

  return (
    <div className="hidden border-r bg-card sm:flex">
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground p-2 rounded-lg">
              <CircleAlert className="h-6 w-6" />
            </div>
            <span className="font-semibold font-headline text-lg">Jalan Blambangan</span>
          </div>
        </SidebarHeader>
        <SidebarContent className="flex flex-col justify-between">
          <div>
            <SidebarMenu>
              <SidebarMenuItem>
                <Link href="/dashboard" passHref legacyBehavior>
                  <SidebarMenuButton isActive={pathname === '/dashboard'} icon={<Home />}>
                    Dashboard
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/dashboard/report" passHref legacyBehavior>
                  <SidebarMenuButton isActive={pathname === '/dashboard/report'} icon={<PlusCircle />}>
                    New Report
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
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
                    <span className="text-muted-foreground flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" /> Reported</span>
                    <Badge variant="destructive">{reportedCount}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-2"><Wrench className="h-4 w-4 text-blue-500" /> In Progress</span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">{inProgressCount}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-green-500" /> Repaired</span>
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
