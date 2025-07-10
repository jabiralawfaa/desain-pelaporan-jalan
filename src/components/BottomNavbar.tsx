"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusCircle, BarChart3, AlertTriangle, ShieldCheck, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useAppContext } from "@/contexts/AppContext";
import { useState } from "react";
import { RecommendationDialog } from "./RecommendationDialog";

export function BottomNavbar() {
    const pathname = usePathname();
    const { reportAreas, user, isAreaDetailOpen } = useAppContext();
    const [isRecDialogOpen, setIsRecDialogOpen] = useState(false);

    const activeCount = reportAreas.filter(a => a.status === 'Active').length;
    const repairedCount = reportAreas.filter(a => a.status === 'Repaired').length;
    const activeReportAreas = reportAreas.filter(area => area.status === 'Active');

    const navItems = [
        { href: "/dashboard", icon: Home, label: "Dashboard" },
        { href: "/dashboard/report", icon: PlusCircle, label: "New Report" },
    ];

    if (isAreaDetailOpen) {
        return null;
    }

    return (
        <div className="sm:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t">
            <div className="grid h-full grid-cols-4 font-medium">
                {navItems.map((item) => (
                    <Link key={item.href} href={item.href} className={cn(
                        "inline-flex flex-col items-center justify-center px-5 hover:bg-muted",
                        pathname === item.href ? "text-primary" : "text-muted-foreground"
                    )}>
                        <item.icon className="w-5 h-5 mb-1" />
                        <span className="text-xs">{item.label}</span>
                    </Link>
                ))}

                <Popover>
                    <PopoverTrigger asChild>
                         <button type="button" className="inline-flex flex-col items-center justify-center px-5 hover:bg-muted text-muted-foreground">
                            <BarChart3 className="w-5 h-5 mb-1" />
                            <span className="text-xs">Status</span>
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 mb-2">
                        <div className="space-y-4">
                            <div className="font-semibold">District Status</div>
                             <div className="space-y-3 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" /> Active Areas</span>
                                    <Badge variant="destructive">{activeCount}</Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-green-500" /> Repaired Areas</span>
                                    <Badge variant="secondary" className="bg-green-100 text-green-800">{repairedCount}</Badge>
                                </div>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                {user?.role === 'admin' && (
                     <>
                        <button onClick={() => setIsRecDialogOpen(true)} disabled={activeReportAreas.length === 0} className="inline-flex flex-col items-center justify-center px-5 hover:bg-muted text-muted-foreground disabled:opacity-50">
                            <Lightbulb className="w-5 h-5 mb-1" />
                            <span className="text-xs">Recommend</span>
                        </button>
                        <RecommendationDialog 
                            isOpen={isRecDialogOpen} 
                            onOpenChange={setIsRecDialogOpen}
                            areas={activeReportAreas}
                        />
                    </>
                )}

            </div>
        </div>
    );
}
