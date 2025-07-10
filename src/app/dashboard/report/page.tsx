import { ReportForm } from '@/components/ReportForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewReportPage() {
  return (
    <div className="flex justify-center items-start py-8">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">New Road Damage Report</CardTitle>
          <CardDescription>Capture an image of the road damage and provide details. Your location will be automatically detected.</CardDescription>
        </CardHeader>
        <CardContent>
          <ReportForm />
        </CardContent>
      </Card>
    </div>
  );
}
