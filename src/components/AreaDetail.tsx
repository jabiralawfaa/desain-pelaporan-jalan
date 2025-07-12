
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
import { AlertTriangle, ShieldCheck, CalendarDays, AlignLeft, Bot, MessageSquare, Star, Send } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Textarea } from "./ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
  const { getAreaById, updateAreaStatus, user, addFeedback } = useAppContext();
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

  const handleMarkAsRepaired = () => {
    if (areaId) {
      updateAreaStatus(areaId, "Repaired");
      // Don't close sheet, let it update
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!areaId || !user) return;
    if (newRating === 0 || newComment.trim() === "") {
        toast({ variant: "destructive", title: "Incomplete Feedback", description: "Please provide a rating and a comment." });
        return;
    }
    setIsSubmitting(true);
    try {
        await addFeedback(areaId, {
            userId: user.username, // Using username as a unique ID for simplicity
            username: user.username,
            rating: newRating,
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
            <SheetHeader className="p-4 sm:p-6 pb-4">
                <SheetTitle className="font-headline text-xl sm:text-2xl flex items-center gap-2">
                    {area.status === 'Active' ? <AlertTriangle className="h-6 w-6 text-destructive" /> : <ShieldCheck className="h-6 w-6 text-green-500" />}
                    Area Details
                </SheetTitle>
                <SheetDescription className="text-xs sm:text-sm">
                    {area.address}
                </SheetDescription>
                <div className="flex items-center gap-2 pt-2">
                    <Badge variant={area.status === 'Active' ? 'destructive' : 'default'} className={area.status === 'Repaired' ? 'bg-green-100 text-green-800' : ''}>
                        {area.status}
                    </Badge>
                   {area.reports.length > 0 && <Badge variant="secondary">{area.reports.length} Laporan</Badge>}
                </div>
            </SheetHeader>
            <ScrollArea className="flex-1 px-4 sm:px-6">
                <div className="space-y-6 pb-6">
                {area.status === 'Active' ? (
                    area.reports.map(report => (
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
                ))) : (
                    <div className="space-y-6">
                        <div className="text-center py-8 text-muted-foreground border-b">
                            <ShieldCheck className="h-12 w-12 mx-auto text-green-500" />
                            <p className="mt-4 font-medium">Area Repaired</p>
                            <p className="text-sm">This area has been marked as repaired.</p>
                        </div>
                        
                        <div className="space-y-4">
                           <h3 className="font-semibold flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" /> 
                            User Feedback
                           </h3>
                            {area.feedback && area.feedback.length > 0 ? (
                                area.feedback.map(fb => (
                                    <div key={fb.userId} className="border p-3 rounded-lg bg-muted/20 text-sm">
                                        <div className="flex justify-between items-start">
                                            <p className="font-semibold">{fb.username}</p>
                                            {user?.role === 'user' && <StarRating rating={fb.rating} disabled />}
                                        </div>
                                        <p className="text-muted-foreground italic my-1">"{fb.comment}"</p>
                                        <p className="text-xs text-muted-foreground text-right">{format(new Date(fb.submittedAt), "PPP")}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">No feedback yet.</p>
                            )}
                        </div>

                        {user?.role === 'user' && !userHasSubmittedFeedback && (
                            <div className="space-y-4 pt-4 border-t">
                                <h3 className="font-semibold">Leave your feedback</h3>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Your Rating</label>
                                    <StarRating rating={newRating} setRating={setNewRating} />
                                </div>
                                <div className="space-y-2">
                                     <label htmlFor="comment" className="text-sm font-medium">Your Comment</label>
                                     <Textarea
                                        id="comment"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Tell us what you think about the repair..."
                                        disabled={isSubmitting}
                                     />
                                </div>
                                <Button onClick={handleFeedbackSubmit} disabled={isSubmitting} className="w-full">
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : <Send className="mr-2" />}
                                    Submit Feedback
                                </Button>
                            </div>
                        )}
                         {user?.role === 'user' && userHasSubmittedFeedback && (
                            <div className="text-center py-4 text-muted-foreground text-sm border-t mt-4">
                                <Check className="h-5 w-5 mx-auto mb-2 text-green-500"/>
                                You have already submitted feedback for this area.
                            </div>
                         )}

                    </div>
                )}
                </div>
            </ScrollArea>

            {user?.role === 'admin' && area.status === 'Active' && (
                <SheetFooter className="p-4 sm:p-6 bg-background border-t mt-auto">
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
