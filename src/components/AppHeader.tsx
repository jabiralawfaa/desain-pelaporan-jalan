"use client";

import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetHeader,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { AppSidebar } from './AppSidebar';
import { PanelLeft, CircleAlert, UserCircle } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function AppHeader() {
  const { user, logout } = useAppContext();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <div className="sm:hidden flex items-center gap-2 font-headline text-lg font-semibold">
        <CircleAlert className="h-6 w-6" />
        <span>Jalan Blambangan</span>
      </div>

      <div className="relative ml-auto flex-1 md:grow-0">
        {/* Can add a search bar here later */}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="overflow-hidden rounded-full"
          >
            <UserCircle className="h-6 w-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuItem>Support</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
