
"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { damageLevels, DamageLevel, RepairStatus } from '@/lib/types';
import { Camera, Send, X, Check, Loader2, LocateFixed } from 'lucide-react';
import Image from 'next/image';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export function ReportForm() {
  const { addReport } = useAppContext();
  const router = useRouter();
  const { toast } = useToast();

  const [isCameraOn, setIsCameraOn] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [damageLevel, setDamageLevel] = useState<DamageLevel>('Medium');
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setIsCameraOn(false);
    }
  }, []);

  const startCamera = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        streamRef.current = stream;
        setIsCameraOn(true);
        setCapturedImage(null);
      } catch (err) {
        console.error("Error accessing camera:", err);
        toast({ variant: 'destructive', title: 'Camera Error', description: 'Could not access the camera.' });
      }
    }
  };

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = video.current.videoHeight;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setCapturedImage(dataUrl);
      stopCamera();
    }
  };

  const getLocation = useCallback(() => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setIsLocating(false);
          toast({ title: "Location Found", description: "Your current location has been set." });
        },
        () => {
          toast({ variant: 'destructive', title: 'Geolocation Error', description: 'Unable to retrieve your location.' });
          setIsLocating(false);
        }
      );
    } else {
      toast({ variant: 'destructive', title: 'Geolocation Error', description: 'Geolocation is not supported by your browser.' });
      setIsLocating(false);
    }
  }, [toast]);
  
  useEffect(() => {
    getLocation();
    
    // Cleanup function to stop the camera when the component unmounts
    return () => {
      if (streamRef.current) {
        stopCamera();
      }
    };
  }, [getLocation, stopCamera]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!capturedImage || !coords) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please capture an image and ensure location is set.' });
      return;
    }
    setIsLoading(true);

    try {
      await addReport({
        image: capturedImage,
        coords,
        damageLevel,
        repairStatus: 'Reported' as RepairStatus,
      });
      toast({ title: 'Report Submitted', description: 'Thank you for your contribution.' });
      router.push('/dashboard');
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Submission Failed', description: 'Could not submit your report.' });
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label>Photo of Damage</Label>
        <div className="mt-2 w-full aspect-video rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/50 overflow-hidden relative">
          {isCameraOn && <video ref={videoRef} autoPlay className="w-full h-full object-cover" />}
          {capturedImage && <Image src={capturedImage} alt="Captured damage" layout="fill" objectFit="cover" />}
          {!isCameraOn && !capturedImage && (
            <div className="text-center text-muted-foreground">
              <Camera className="mx-auto h-12 w-12" />
              <p>Start camera to take a photo</p>
            </div>
          )}
        </div>
        <div className="mt-2 flex gap-2">
            {!isCameraOn ? (
                 <Button type="button" onClick={startCamera}>
                    <Camera className="mr-2 h-4 w-4" />
                    {capturedImage ? 'Retake Photo' : 'Start Camera'}
                 </Button>
            ) : (
                <>
                <Button type="button" onClick={captureImage} variant="default">
                    <Check className="mr-2 h-4 w-4" />
                    Capture
                </Button>
                <Button type="button" onClick={stopCamera} variant="outline">
                    <X className="mr-2 h-4 w-4" />
                    Close Camera
                </Button>
                </>
            )}
        </div>
      </div>
      
      <div className="space-y-2">
        <Label className="flex items-center gap-2">Location {isLocating && <Loader2 className="h-4 w-4 animate-spin" />}</Label>
        <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 border rounded-md">
            <LocateFixed className="h-4 w-4 text-primary" />
            <span>{coords ? `Lat: ${coords.lat.toFixed(4)}, Lng: ${coords.lng.toFixed(4)}` : 'Location not set'}</span>
        </div>
        <Button type="button" variant="link" size="sm" className="p-0 h-auto" onClick={getLocation}>Refresh location</Button>
      </div>

      <div className="space-y-2">
        <Label>Damage Level</Label>
        <RadioGroup value={damageLevel} onValueChange={(val: DamageLevel) => setDamageLevel(val)} className="flex gap-4">
            {damageLevels.map(level => (
                 <Label key={level} htmlFor={level} className="flex items-center gap-2 cursor-pointer p-3 border rounded-md flex-1 justify-center has-[:checked]:bg-accent has-[:checked]:border-primary transition-all">
                    <RadioGroupItem value={level} id={level} />
                    {level}
                </Label>
            ))}
        </RadioGroup>
      </div>
      
      <Button type="submit" className="w-full" disabled={isLoading || !capturedImage || !coords}>
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
        {isLoading ? 'Submitting...' : 'Submit Report'}
      </Button>
    </form>
  );
}
