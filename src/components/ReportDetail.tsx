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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppContext } from "@/contexts/AppContext";
import { Report, RepairStatus, repairStatuses, DamageLevel } from "@/lib/types";
import Image from "next/image";
import { format } from "date-fns";
import { Skeleton } from "./ui/skeleton";
import { AlertTriangle, Wrench, ShieldCheck, MapPin, CalendarDays, BarChartBig, AlignLeft } from "lucide-react";

type ReportDetailProps = {
  reportId: string | null;
  onOpenChange: (open: boolean) => void;
};

const statusIcons: Record<RepairStatus, React.ReactNode> = {
    Reported: <AlertTriangle className="h-4 w-4 text-destructive" />,
    "In Progress": <Wrench className="h-4 w-4 text-blue-500" />,
    Repaired: <ShieldCheck className="h-4 w-4 text-green-500" />,
};

const statusColors: Record<RepairStatus, string> = {
  Reported: 'destructive',
  'In Progress': 'default',
  Repaired: 'default',
}

const damageColors: Record<DamageLevel, string> = {
    Low: "bg-green-100 text-green-800",
    Medium: "bg-yellow-100 text-yellow-800",
    High: "bg-red-100 text-red-800",
};

export function ReportDetail({ reportId, onOpenChange }: ReportDetailProps) {
  const { getReportById, updateReportStatus, user } = useAppContext();
  const [report, setReport] = useState<Report | null | undefined>(null);
  const [currentStatus, setCurrentStatus] = useState<RepairStatus | undefined>();

  useEffect(() => {
    if (reportId) {
      const foundReport = getReportById(reportId);
      setReport(foundReport);
      setCurrentStatus(foundReport?.repairStatus);
    } else {
      setReport(null);
    }
  }, [reportId, getReportById]);

  const handleStatusChange = (newStatus: RepairStatus) => {
    setCurrentStatus(newStatus);
  };

  const handleSaveChanges = () => {
    if (reportId && currentStatus) {
      updateReportStatus(reportId, currentStatus);
      onOpenChange(false);
    }
  };

  const isOpen = !!reportId;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0">
        {!report ? (
          <div className="p-6 space-y-4">
             <Skeleton className="h-48 w-full rounded-lg" />
             <Skeleton className="h-8 w-3/4" />
             <Skeleton className="h-4 w-1/2" />
             <div className="space-y-2 pt-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-2/3" />
             </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <SheetHeader className="p-6">
              <SheetTitle className="font-headline text-2xl">Report Details</SheetTitle>
              <SheetDescription>
                Details for report #{report.id.slice(0, 7)}
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-6 space-y-6">
                <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                    <Image
                        src={report.image}
                        alt="Road damage"
                        layout="fill"
                        objectFit="cover"
                        data-ai-hint="road damage"
                    />
                </div>
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        {statusIcons[report.repairStatus]}
                        <Badge variant={report.repairStatus === 'In Progress' ? "secondary" : statusColors[report.repairStatus]} className={report.repairStatus === 'In Progress' ? 'bg-blue-100 text-blue-800' : ''}>
                          {report.repairStatus}
                        </Badge>
                    </div>

                    {report.description && (
                       <div className="flex items-start gap-3 text-sm text-muted-foreground">
                        <AlignLeft className="h-4 w-4 mt-1 flex-shrink-0" />
                        <p className="italic">"{report.description}"</p>
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4"/> 
                        <span>{report.address}</span>
                    </div>

                     <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <CalendarDays className="h-4 w-4"/> 
                        <span>Reported on {format(new Date(report.reportedAt), "PPP")}</span>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                        <BarChartBig className="h-4 w-4 text-muted-foreground"/> 
                        <span className="text-muted-foreground">Damage Level:</span>
                        <Badge variant="outline" className={`${damageColors[report.damageLevel]}`}>
                            {report.damageLevel}
                        </Badge>
                    </div>

                    {user?.role === 'admin' && (
                        <div className="pt-4 space-y-2">
                        <Label htmlFor="status">Update Repair Status</Label>
                        <Select onValueChange={handleStatusChange} value={currentStatus}>
                            <SelectTrigger id="status">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                            {repairStatuses.map(status => (
                                <SelectItem key={status} value={status}>
                                {status}
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        </div>
                    )}
                </div>
            </div>

            {user?.role === 'admin' && (
            <SheetFooter className="p-6 bg-muted/50 mt-auto">
              <Button onClick={() => onOpenChange(false)} variant="outline">Cancel</Button>
              <Button onClick={handleSaveChanges}>Save Changes</Button>
            </SheetFooter>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
