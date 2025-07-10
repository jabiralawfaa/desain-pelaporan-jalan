"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/contexts/AppContext";
import { ReportArea } from "@/lib/types";
import Image from "next/image";
import { format } from "date-fns";
import { Skeleton } from "./ui/skeleton";
import { AlertTriangle, ShieldCheck, MapPin, CalendarDays, AlignLeft, Bot } from "lucide-react";

type AreaDetailProps = {
  areaId: string | null;
  onOpenChange: (open: boolean) => void;
};

export function AreaDetail({ areaId, onOpenChange }: AreaDetailProps) {
  const { getAreaById, updateAreaStatus, user } = useAppContext();
  const [area, setArea] = useState<ReportArea | null | undefined>(null);

  useEffect(() => {
    if (areaId) {
      const foundArea = getAreaById(areaId);
      setArea(foundArea);
    } else {
      setArea(null);
    }
  }, [areaId, getAreaById]);

  const handleMarkAsRepaired = () => {
    if (areaId) {
      updateAreaStatus(areaId, "Repaired");
      onOpenChange(false);
    }
  };

  const isOpen = !!areaId;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        {!area ? (
          <div className="p-6 space-y-4">
             <Skeleton className="h-10 w-3/4" />
             <Skeleton className="h-4 w-1/2" />
             <div className="space-y-2 pt-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-2/3" />
             </div>
          </div>
        ) : (
            <>
            <SheetHeader className="p-6 pb-4">
                <SheetTitle className="font-headline text-2xl flex items-center gap-2">
                    {area.status === 'Active' ? <AlertTriangle className="h-6 w-6 text-destructive" /> : <ShieldCheck className="h-6 w-6 text-green-500" />}
                    Area Details
                </SheetTitle>
                <SheetDescription>
                    {area.address}
                </SheetDescription>
                <div className="flex items-center gap-2 pt-2">
                    <Badge variant={area.status === 'Active' ? 'destructive' : 'default'} className={area.status === 'Repaired' ? 'bg-green-100 text-green-800' : ''}>
                        {area.status}
                    </Badge>
                   {area.reports.length > 0 && <Badge variant="secondary">{area.reports.length} Laporan</Badge>}
                </div>
            </SheetHeader>
            <ScrollArea className="flex-1 px-6">
                <div className="space-y-6 pb-6">
                {area.reports.length > 0 ? area.reports.map(report => (
                    <div key={report.id} className="border p-4 rounded-lg space-y-3 bg-muted/20">
                         <div className="relative w-full h-40 rounded-md overflow-hidden border">
                            <Image
                                src={report.image}
                                alt="Road damage"
                                layout="fill"
                                objectFit="cover"
                                data-ai-hint="road damage"
                            />
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Bot className="h-4 w-4"/> 
                                <span>AI-detected Damage: <strong>{report.damageLevel}</strong></span>
                            </div>
                            {report.description && (
                                <div className="flex items-start gap-2 text-muted-foreground">
                                    <AlignLeft className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                    <p className="italic">"{report.description}"</p>
                                </div>
                            )}
                             <div className="flex items-center gap-2 text-muted-foreground">
                                <CalendarDays className="h-4 w-4"/> 
                                <span>Reported on {format(new Date(report.reportedAt), "PPP")}</span>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-12 text-muted-foreground">
                        <ShieldCheck className="h-12 w-12 mx-auto text-green-500" />
                        <p className="mt-4 font-medium">Area Repaired</p>
                        <p className="text-sm">This area has been marked as repaired.</p>
                    </div>
                )}
                </div>
            </ScrollArea>

            {user?.role === 'admin' && area.status === 'Active' && (
                <SheetFooter className="p-6 bg-muted/50 mt-auto">
                <Button onClick={handleMarkAsRepaired} className="w-full" size="lg">
                    <ShieldCheck className="mr-2 h-5 w-5"/> Mark Area as Repaired
                </Button>
                </SheetFooter>
            )}
            </>
        )}
      </SheetContent>
    </Sheet>
  );
}
