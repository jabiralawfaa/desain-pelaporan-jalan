
"use client";

import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Percent, Check, Loader2, Save } from 'lucide-react';
import { ReportArea } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

const ReportItem = ({ area }: { area: ReportArea }) => {
    const { updateAreaProgress } = useAppContext();
    const { toast } = useToast();
    const [progress, setProgress] = useState(area.progress);
    const [isLoading, setIsLoading] = useState(false);

    const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = parseInt(e.target.value, 10);
        if (isNaN(value)) {
            value = 0;
        }
        if (value < 0) {
            value = 0;
        }
        if (value > 100) {
            value = 100;
        }
        setProgress(value);
    };

    const handleSaveProgress = () => {
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            updateAreaProgress(area.id, progress);
            setIsLoading(false);
            toast({
                title: "Progress Updated",
                description: `Progress for ${area.address} has been set to ${progress}%.`,
            });
        }, 500);
    };

    const isDirty = progress !== area.progress;

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                           <AlertTriangle className="text-destructive h-5 w-5" /> {area.address}
                        </CardTitle>
                        <CardDescription>{area.reports.length} laporan di area ini.</CardDescription>
                    </div>
                    <Badge variant="destructive">{area.status}</Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-muted-foreground">Progres Perbaikan</span>
                         <span className="font-bold text-lg text-primary flex items-center gap-1">{progress}<Percent className="h-4 w-4"/></span>
                    </div>
                    <Progress value={progress} className="w-full" />
                    <div className="flex items-center gap-2 pt-2">
                        <Input
                            type="number"
                            value={progress}
                            onChange={handleProgressChange}
                            min="0"
                            max="100"
                            className="w-24"
                        />
                         <span className="text-muted-foreground">%</span>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                 <Button onClick={handleSaveProgress} disabled={!isDirty || isLoading} className="w-full">
                    {isLoading ? <Loader2 className="animate-spin" /> : <Save className="mr-2" />}
                    {isLoading ? 'Menyimpan...' : 'Simpan Progres'}
                </Button>
            </CardFooter>
        </Card>
    );
};


export default function DaftarLaporanPage() {
    const { reportAreas } = useAppContext();
    const activeAreas = reportAreas.filter(area => area.status === 'Active');

    return (
        <div className="flex justify-center items-start py-8 h-full">
            <Card className="w-full max-w-4xl shadow-lg h-full flex flex-col">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Daftar Laporan Aktif</CardTitle>
                    <CardDescription>
                        Kelola dan perbarui progres perbaikan untuk setiap area yang memiliki laporan aktif.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 min-h-0">
                  <ScrollArea className="h-full pr-4">
                    <div className="space-y-4">
                        {activeAreas.length > 0 ? (
                            activeAreas.map(area => <ReportItem key={area.id} area={area} />)
                        ) : (
                            <div className="text-center py-16 text-muted-foreground">
                                <Check className="h-12 w-12 mx-auto mb-4 text-green-500" />
                                <h3 className="text-xl font-semibold">Semua Laporan Tertangani!</h3>
                                <p>Tidak ada area dengan laporan aktif saat ini.</p>
                            </div>
                        )}
                    </div>
                  </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
