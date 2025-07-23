"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Camera, Send, X, Check, Loader2, LocateFixed } from 'lucide-react';
import Image from 'next/image';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export function ReportForm() {
  const { addReport, user } = useAppContext();
  const router = useRouter();
  const { toast } = useToast();

  const [isCameraOn, setIsCameraOn] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
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
        setHasCameraPermission(true);
        setCapturedImage(null);
      } catch (err) {
        console.error("Error accessing camera:", err);
        setHasCameraPermission(false);
        toast({ variant: 'destructive', title: 'Camera Error', description: 'Could not access the camera. Please check permissions.' });
      }
    } else {
      setHasCameraPermission(false);
      toast({ variant: 'destructive', title: 'Camera Error', description: 'Camera is not supported by your browser.' });
    }
  };
  
  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
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
    
    return () => {
      stopCamera();
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
      const roadInfo = await fetchRoadInfo(coords.lat, coords.lng);
      await addReport({
        image: capturedImage,
        description,
        coords,
        ...roadInfo, // roadName, roadType, roadLength
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
        <Label>Photo of Damage (Laporan oleh: {user?.role})</Label>
        <div className="mt-2 w-full aspect-video rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/50 overflow-hidden relative">
          <video ref={videoRef} autoPlay muted playsInline className={`w-full h-full object-cover ${isCameraOn ? 'block' : 'hidden'}`} />
          {capturedImage && <Image src={capturedImage} alt="Captured damage" layout="fill" objectFit="cover" />}
          {!isCameraOn && !capturedImage && (
            <div className="text-center text-muted-foreground p-4">
              <Camera className="mx-auto h-12 w-12" />
              <p className="mt-2">Start camera to take a photo</p>
            </div>
          )}
        </div>

        {hasCameraPermission === false && (
          <Alert variant="destructive" className="mt-2">
            <AlertTitle>Camera Access Denied</AlertTitle>
            <AlertDescription>
              Please allow camera access in your browser settings to use this feature.
            </AlertDescription>
          </Alert>
        )}
        
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
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          placeholder="e.g. Large pothole near the intersection"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2">Location {isLocating && <Loader2 className="h-4 w-4 animate-spin" />}</Label>
        <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 border rounded-md">
            <LocateFixed className="h-4 w-4 text-primary" />
            <span>{coords ? `Lat: ${coords.lat.toFixed(4)}, Lng: ${coords.lng.toFixed(4)}` : 'Location not set'}</span>
        </div>
        <Button type="button" variant="link" size="sm" className="p-0 h-auto" onClick={getLocation}>Refresh location</Button>
      </div>
      
      <Button type="submit" className="w-full" disabled={isLoading || !capturedImage || !coords}>
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
        {isLoading ? 'Submitting...' : 'Submit Report'}
      </Button>
    </form>
  );
}

async function fetchRoadInfo(lat: number, lon: number) {
  const query = `
    [out:json];
    way(around:50,${lat},${lon})[highway];
    (._;>;);
    out geom;
  `;
  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: query,
  });
  const data = await response.json();
  const way = data.elements.find((el: any) => el.type === 'way' && el.tags && el.tags.name);
  if (!way) return null;

  // Hitung panjang jalan (pakai Haversine)
  let length = 0;
  for (let i = 1; i < way.geometry.length; i++) {
    length += haversine(way.geometry[i - 1], way.geometry[i]);
  }

  return {
    roadName: way.tags.name,
    roadType: way.tags.highway,
    roadLength: length, // dalam meter
  };
}

// Fungsi Haversine sederhana
function haversine(a: {lat: number, lon: number}, b: {lat: number, lon: number}) {
  const toRad = (x: number) => x * Math.PI / 180;
  const R = 6371000; // meter
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const aVal = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1-aVal));
  return R * c;
}
