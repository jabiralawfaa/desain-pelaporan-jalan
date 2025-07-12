
"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/contexts/AppContext";
import { Report, ReportArea } from "@/lib/types";
import Image from "next/image";
import { format } from "date-fns";
import { Skeleton } from "./ui/skeleton";
import { AlertTriangle, ShieldCheck, CalendarDays, AlignLeft, Bot, MessageSquare, Star, Send, Loader2, Check, History, CircleAlert, UserCheck } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Textarea } from "./ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "./ui/card";

type AreaDetailProps = {
  areaId: string | null;
  onOpenChange: (open: boolean) => void;
};

const StarRating = ({ rating, setRating, disabled = false }: { rating: number, setRating?: (rating: number) => void, disabled?: boolean }) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "h-5 w-5",
            rating >= star ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground",
            !disabled && "cursor-pointer"
          )}
          onClick={() => !disabled && setRating?.(star)}
        />
      ))}
    </div>
  );
};

export function AreaDetail({ areaId, onOpenChange }: AreaDetailProps) {
  const { getAreaById, user, addFeedback } = useAppContext();
  const [area, setArea] = useState<ReportArea | null | undefined>(null);
  const isMobile = useIsMobile();
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (areaId) {
      const foundArea = getAreaById(areaId);
      setArea(foundArea);
      // Reset form on area change
      setNewComment("");
      setNewRating(0);
    } else {
      setArea(null);
    }
  }, [areaId, getAreaById]);

  const handleFeedbackSubmit = async () => {
    if (!areaId || !user || !area) return;

    const isRepaired = area.status === 'Repaired';
    const isRatingInvalid = isRepaired && newRating === 0;
    const isCommentInvalid = newComment.trim() === "";

    if (isCommentInvalid || isRatingInvalid) {
        toast({ 
            variant: "destructive", 
            title: "Incomplete Feedback", 
            description: isRepaired 
                ? "Please provide a rating and a comment."
                : "Please provide a comment."
        });
        return;
    }

    setIsSubmitting(true);
    try {
        await addFeedback(areaId, {
            userId: user.username, // Using username as a unique ID for simplicity
            username: user.username,
            rating: isRepaired ? newRating : 0, // Submit 0 if not repaired
            comment: newComment,
            submittedAt: new Date().toISOString()
        });
        toast({ title: "Feedback Submitted", description: "Thank you for your feedback!" });
        setNewComment("");
        setNewRating(0);
    } catch(e) {
        toast({ variant: "destructive", title: "Submission Failed", description: "Could not submit your feedback." });
    } finally {
        setIsSubmitting(false);
    }
  }

  const isOpen = !!areaId;
  const sheetSide = isMobile ? "bottom" : "right";
  const userHasSubmittedFeedback = area?.feedback?.some(f => f.userId === user?.username);

  const sortedReports = area?.reports?.sort((a, b) => {
    if (a.reporterRole === 'surveyor' && b.reporterRole !== 'surveyor') return -1;
    if (a.reporterRole !== 'surveyor' && b.reporterRole === 'surveyor') return 1;
    return new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime();
  });

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange} modal={!isMobile}>
      <SheetContent 
        side={sheetSide} 
        className={
          isMobile 
          ? "w-full h-[85vh] p-0 flex flex-col" 
          : "w-full sm:max-w-lg p-0 flex flex-col"
        }
        overlayClassName={isMobile ? "bg-black/20" : "bg-transparent"}
      >
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
            <SheetHeader className="p-4 sm:p-6 pb-2">
                <SheetTitle className="font-headline text-xl sm:text-2xl flex items-center gap-2">
                    {area.status === 'Active' ? <AlertTriangle className="h-6 w-6 text-destructive" /> : <ShieldCheck className="h-6 w-6 text-green-500" />}
                    Detail Area
                </SheetTitle>
                <SheetDescription className="text-xs sm:text-sm">
                    {area.address}
                </SheetDescription>
                <div className="flex items-center gap-2 pt-1">
                    <Badge variant={area.status === 'Active' ? 'destructive' : 'default'} className={area.status === 'Repaired' ? 'bg-green-100 text-green-800' : ''}>
                        {area.status}
                    </Badge>
                   {area.reports.length > 0 && <Badge variant="secondary">{area.reports.length} Laporan</Badge>}
                </div>
            </SheetHeader>
            
            <Tabs defaultValue="reports" className="w-full flex-1 flex flex-col min-h-0">
                <TabsList className="mx-4 sm:mx-6">
                    <TabsTrigger value="reports" className="gap-2"><CircleAlert className="h-4 w-4"/> Laporan</TabsTrigger>
                    <TabsTrigger value="history" className="gap-2"><History className="h-4 w-4"/> Histori</TabsTrigger>
                    <TabsTrigger value="comments" className="gap-2"><MessageSquare className="h-4 w-4"/> Komentar</TabsTrigger>
                </TabsList>

                <ScrollArea className="flex-1">
                    <div className="px-4 sm:px-6 py-4">

                    <TabsContent value="reports" className="m-0">
                        {sortedReports && sortedReports.length > 0 ? (
                            <div className="space-y-4">
                                {sortedReports.map((report: Report) => {
                                 const isSurveyorReport = report.reporterRole === 'surveyor';
                                 return (
                                <Card key={report.id} className={cn(isSurveyorReport && "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800")}>
                                    <CardContent className="p-4 space-y-3">
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
                                            {isSurveyorReport && (
                                                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold">
                                                  <UserCheck className="h-4 w-4"/>
                                                  <span>Laporan oleh Petugas Surveyor</span>
                                                </div>
                                            )}
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
                                    </CardContent>
                                </Card>
                                 )})}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                {area.status === 'Active' 
                                 ? <p>No active reports for this area.</p>
                                 : <><ShieldCheck className="h-10 w-10 mx-auto mb-2 text-green-500" /><p>Tidak ada laporan aktif karena area ini sudah diperbaiki.</p></>
                                }
                            </div>
                        )}
                    </TabsContent>
                    
                    <TabsContent value="history" className="m-0">
                         <div className="text-center py-8 text-muted-foreground">
                            <History className="h-10 w-10 mx-auto mb-2" />
                            <p>Fitur histori perbaikan sedang dalam pengembangan.</p>
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="comments" className="m-0">
                         <div className="space-y-4">
                            {area.feedback && area.feedback.length > 0 ? (
                                area.feedback.map(fb => (
                                    <Card key={fb.userId + fb.submittedAt}>
                                      <CardContent className="p-4">
                                        <div className="flex justify-between items-start">
                                            <p className="font-semibold">{fb.username}</p>
                                            {fb.rating > 0 && <StarRating rating={fb.rating} disabled />}
                                        </div>
                                        <p className="text-muted-foreground italic my-1">"{fb.comment}"</p>
                                        <p className="text-xs text-muted-foreground text-right">{format(new Date(fb.submittedAt), "PPP")}</p>
                                      </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">Belum ada feedback.</p>
                            )}

                            {user?.role === 'user' && !userHasSubmittedFeedback && (
                                <Card className="mt-6 bg-muted/50">
                                    <CardContent className="p-4">
                                        <h3 className="font-semibold mb-4">Tinggalkan feedback Anda</h3>
                                        <div className="space-y-3">
                                            {area.status === 'Repaired' && (
                                            <div>
                                                <label className="text-sm font-medium">Rating Anda</label>
                                                <StarRating rating={newRating} setRating={setNewRating} />
                                            </div>
                                            )}
                                            <div>
                                                <label htmlFor="comment" className="text-sm font-medium">Komentar Anda</label>
                                                <Textarea
                                                    id="comment"
                                                    value={newComment}
                                                    onChange={(e) => setNewComment(e.target.value)}
                                                    placeholder={area.status === 'Repaired' 
                                                        ? "Bagaimana pendapat Anda tentang hasil perbaikannya?" 
                                                        : "Tambahkan detail atau sampaikan urgensi mengenai kerusakan ini."
                                                    }
                                                    disabled={isSubmitting}
                                                />
                                            </div>
                                            <Button onClick={handleFeedbackSubmit} disabled={isSubmitting} className="w-full">
                                                {isSubmitting ? <Loader2 className="animate-spin" /> : <Send className="mr-2" />}
                                                Kirim Feedback
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {user?.role === 'user' && userHasSubmittedFeedback && (
                                <div className="text-center py-4 text-muted-foreground text-sm border-t mt-4">
                                    <Check className="h-5 w-5 mx-auto mb-2 text-green-500"/>
                                    Anda sudah mengirimkan feedback untuk area ini.
                                </div>
                            )}

                         </div>
                    </TabsContent>
                    </div>
                </ScrollArea>
            </Tabs>
            </>
        )}
      </SheetContent>
    </Sheet>
  );
}
