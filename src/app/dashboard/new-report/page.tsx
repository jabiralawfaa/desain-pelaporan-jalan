
"use client";

import { ReportForm } from "@/components/ReportForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function NewReportPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="absolute top-4 left-4">
        <Link href="/dashboard" passHref>
           <button className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary">
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Dashboard
           </button>
        </Link>
      </div>
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary text-primary-foreground rounded-full p-3 w-fit mb-4">
            <MapPin className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-headline">Laporan Kerusakan Baru</CardTitle>
          <CardDescription>Isi detail kerusakan jalan untuk dilaporkan.</CardDescription>
        </CardHeader>
        <CardContent>
          <ReportForm />
        </CardContent>
      </Card>
    </main>
  );
}
 